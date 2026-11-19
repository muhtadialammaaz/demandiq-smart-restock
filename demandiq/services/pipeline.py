"""
DemandIQ Orchestration Pipeline (Steps 3-8 of PRD Workflow)
"""

from datetime import datetime, timedelta
import numpy as np
from .events import estimate_multipliers_for_dataset
from .forecast import run_sku_forecast
from .planner import plan_sku_reorder
from .advisor import generate_advisory

def run_pipeline(conn, dataset_id):
    cur = conn.cursor()

    # Rule: Cascading delete old forecast_runs for this dataset
    cur.execute("DELETE FROM forecast_runs WHERE dataset_id = ?", (dataset_id,))
    conn.commit()

    # 1. Learn/update event multipliers
    estimate_multipliers_for_dataset(conn, dataset_id)

    # 2. Fetch dataset settings
    cur.execute("SELECT * FROM settings WHERE dataset_id = ?", (dataset_id,))
    settings_row = cur.fetchone()
    settings = dict(settings_row) if settings_row else {}
    horizon_days = settings.get("horizon_days", 60)
    backtest_days = settings.get("backtest_days", 28)

    # 3. Fetch all products
    cur.execute("SELECT * FROM products WHERE dataset_id = ?", (dataset_id,))
    products = [dict(r) for r in cur.fetchall()]

    # 4. Get active date range
    cur.execute("SELECT MIN(sale_date) as min_d, MAX(sale_date) as max_d FROM sales_daily WHERE dataset_id = ?", (dataset_id,))
    date_bounds = cur.fetchone()
    min_date_str = date_bounds["min_d"] if date_bounds and date_bounds["min_d"] else "2024-01-01"
    max_date_str = date_bounds["max_d"] if date_bounds and date_bounds["max_d"] else datetime.now().strftime("%Y-%m-%d")

    start_dt = datetime.strptime(min_date_str, "%Y-%m-%d")
    end_dt = datetime.strptime(max_date_str, "%Y-%m-%d")
    total_history_days = max(1, (end_dt - start_dt).days + 1)

    summary_stats = {
        "products_analyzed": len(products),
        "total_money_at_risk": 0.0,
        "lost_sales_risk": 0.0,
        "cash_tied_up": 0.0,
        "items_needing_action": 0,
        "critical_count": 0,
        "soon_count": 0,
        "ok_count": 0,
        "overstock_count": 0,
        "dead_count": 0
    }

    for prod in products:
        sku = prod["sku"]

        # Build complete daily history array, filling missing days with 0 (PRD step 3)
        cur.execute("""
            SELECT sale_date, qty
            FROM sales_daily
            WHERE dataset_id = ? AND sku = ?
            ORDER BY sale_date ASC
        """, (dataset_id, sku))
        sales_map = {r["sale_date"]: r["qty"] for r in cur.fetchall()}

        history_series = []
        for d in range(total_history_days):
            dt_s = (start_dt + timedelta(days=d)).strftime("%Y-%m-%d")
            history_series.append(sales_map.get(dt_s, 0))

        # Run model selection and forecast (PRD step 5)
        forecast_res = run_sku_forecast(history_series, horizon=horizon_days, backtest_days=backtest_days)

        # Record forecast run
        cur.execute("""
            INSERT INTO forecast_runs (dataset_id, sku, as_of, model_used, wape_model, wape_naive, bias, sigma_daily, history_days)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            dataset_id,
            sku,
            max_date_str,
            forecast_res["model_used"],
            forecast_res["wape_model"],
            forecast_res["wape_naive"],
            forecast_res["bias"],
            forecast_res["sigma_daily"],
            total_history_days
        ))
        run_id = cur.lastrowid

        # Insert forecast points
        yhat_vals = forecast_res["yhat"]
        lo_vals = forecast_res["lo"]
        hi_vals = forecast_res["hi"]

        for idx in range(len(yhat_vals)):
            forecast_day = (end_dt + timedelta(days=idx + 1)).strftime("%Y-%m-%d")
            cur.execute("""
                INSERT INTO forecast_points (run_id, day, yhat, lo, hi, event_factor)
                VALUES (?, ?, ?, ?, ?, 1.0)
            """, (run_id, forecast_day, yhat_vals[idx], lo_vals[idx], hi_vals[idx]))

        # Reorder planning & Money at Risk (PRD steps 6 & 7)
        plan = plan_sku_reorder(prod, forecast_res, settings, as_of_date_str=max_date_str)

        # Advisory message generation (PRD step 8)
        advisory = generate_advisory(prod["name"], plan, currency="BDT")

        # Save recommendation
        cur.execute("""
            INSERT INTO recommendations (
                run_id, dataset_id, sku, status, inventory_class, days_of_cover, stockout_date,
                order_qty, units_short, lost_revenue, lost_margin, cash_tied_up, message_bn, message_en
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            run_id,
            dataset_id,
            sku,
            plan["status"],
            plan["inventory_class"],
            plan["days_of_cover"],
            plan["stockout_date"],
            plan["order_qty"],
            plan["units_short"],
            plan["lost_revenue"],
            plan["lost_margin"],
            plan["cash_tied_up"],
            advisory["message_bn"],
            advisory["message_en"]
        ))

        # Accumulate summary stats
        status = plan["status"]
        if status in ("critical", "soon"):
            summary_stats["lost_sales_risk"] += plan["lost_revenue"]
            summary_stats["items_needing_action"] += 1
            if status == "critical":
                summary_stats["critical_count"] += 1
            else:
                summary_stats["soon_count"] += 1
        elif status in ("overstock", "dead"):
            summary_stats["cash_tied_up"] += plan["cash_tied_up"]
            summary_stats["items_needing_action"] += 1
            if status == "overstock":
                summary_stats["overstock_count"] += 1
            else:
                summary_stats["dead_count"] += 1
        else:
            summary_stats["ok_count"] += 1

    summary_stats["total_money_at_risk"] = summary_stats["lost_sales_risk"] + summary_stats["cash_tied_up"]
    conn.commit()
    return summary_stats
