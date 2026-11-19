"""
DemandIQ REST API Implementation (Section 8 of PRD v1.0)
Full implementation of endpoints with SQLite backend.
"""

import json
import csv
import io
from urllib.parse import parse_qs, urlparse
from ..db import get_connection, init_db
from ..services.synth import generate_sample_dataset
from ..services.pipeline import run_pipeline

def handle_api_request(method, path, query_params, body_bytes, headers):
    conn = get_connection()
    try:
        cur = conn.cursor()

        # 1. /health
        if path == "/health" and method == "GET":
            return 200, {"status": "ok", "service": "DemandIQ Smart Restock", "version": "1.0"}

        # 2. POST /api/datasets/sample
        if path == "/api/datasets/sample" and method == "POST":
            ds_id = generate_sample_dataset(conn)
            summary = run_pipeline(conn, ds_id)
            return 201, {"dataset_id": ds_id, "summary": summary, "message": "Synthetic dataset created and analyzed."}

        # 3. POST /api/datasets/{id}/analyze
        parts = [p for p in path.split("/") if p]
        if len(parts) == 4 and parts[0] == "api" and parts[1] == "datasets" and parts[3] == "analyze" and method == "POST":
            ds_id = int(parts[2])
            summary = run_pipeline(conn, ds_id)
            return 200, {"dataset_id": ds_id, "summary": summary}

        # 4. GET /api/datasets/{id}/summary
        if len(parts) == 4 and parts[0] == "api" and parts[1] == "datasets" and parts[3] == "summary" and method == "GET":
            ds_id = int(parts[2])
            cur.execute("""
                SELECT 
                    SUM(lost_revenue) as lost_sales_risk,
                    SUM(cash_tied_up) as cash_tied_up,
                    COUNT(CASE WHEN status IN ('critical','soon','overstock','dead') THEN 1 END) as action_count,
                    COUNT(CASE WHEN status = 'critical' THEN 1 END) as critical_count,
                    COUNT(CASE WHEN status = 'soon' THEN 1 END) as soon_count,
                    COUNT(CASE WHEN status = 'ok' THEN 1 END) as ok_count,
                    COUNT(CASE WHEN status = 'overstock' THEN 1 END) as overstock_count,
                    COUNT(CASE WHEN status = 'dead' THEN 1 END) as dead_count
                FROM recommendations
                WHERE dataset_id = ?
            """, (ds_id,))
            row = cur.fetchone()
            lost_sales = row["lost_sales_risk"] or 0.0
            cash_tied = row["cash_tied_up"] or 0.0
            return 200, {
                "dataset_id": ds_id,
                "money_at_risk": round(lost_sales + cash_tied, 2),
                "lost_sales_risk": round(lost_sales, 2),
                "cash_tied_up": round(cash_tied, 2),
                "action_count": row["action_count"],
                "counts": {
                    "critical": row["critical_count"],
                    "soon": row["soon_count"],
                    "ok": row["ok_count"],
                    "overstock": row["overstock_count"],
                    "dead": row["dead_count"]
                }
            }

        # 5. GET /api/datasets/{id}/products
        if len(parts) == 4 and parts[0] == "api" and parts[1] == "datasets" and parts[3] == "products" and method == "GET":
            ds_id = int(parts[2])
            status_filter = query_params.get("status", [None])[0]
            search_q = query_params.get("q", [None])[0]

            sql = """
                SELECT p.sku, p.name, p.category, p.unit_price, p.unit_cost, p.current_stock,
                       r.status, r.inventory_class, r.days_of_cover, r.stockout_date,
                       r.order_qty, r.lost_revenue, r.cash_tied_up, r.message_bn, r.message_en
                FROM products p
                LEFT JOIN recommendations r ON p.dataset_id = r.dataset_id AND p.sku = r.sku
                WHERE p.dataset_id = ?
            """
            params = [ds_id]
            if status_filter and status_filter != "all":
                sql += " AND r.status = ?"
                params.append(status_filter)
            if search_q:
                sql += " AND (p.name LIKE ? OR p.sku LIKE ?)"
                params.extend([f"%{search_q}%", f"%{search_q}%"])

            sql += " ORDER BY CASE r.status WHEN 'critical' THEN 1 WHEN 'soon' THEN 2 WHEN 'overstock' THEN 3 WHEN 'dead' THEN 4 ELSE 5 END, r.lost_revenue DESC"

            cur.execute(sql, tuple(params))
            products = [dict(r) for r in cur.fetchall()]
            return 200, {"dataset_id": ds_id, "products": products}

        # 6. GET /api/datasets/{id}/products/{sku}
        if len(parts) == 5 and parts[0] == "api" and parts[1] == "datasets" and parts[3] == "products" and method == "GET":
            ds_id = int(parts[2])
            sku = parts[4]

            cur.execute("SELECT * FROM products WHERE dataset_id = ? AND sku = ?", (ds_id, sku))
            prod = cur.fetchone()
            if not prod:
                return 404, {"error": "PRODUCT_NOT_FOUND", "message_en": "SKU not found in dataset."}

            cur.execute("SELECT * FROM forecast_runs WHERE dataset_id = ? AND sku = ? ORDER BY id DESC LIMIT 1", (ds_id, sku))
            frun = cur.fetchone()
            points = []
            if frun:
                cur.execute("SELECT day, yhat, lo, hi FROM forecast_points WHERE run_id = ? ORDER BY day ASC", (frun["id"],))
                points = [dict(pt) for pt in cur.fetchall()]

            cur.execute("SELECT * FROM recommendations WHERE dataset_id = ? AND sku = ?", (ds_id, sku))
            rec = cur.fetchone()

            cur.execute("SELECT sale_date, qty, revenue FROM sales_daily WHERE dataset_id = ? AND sku = ? ORDER BY sale_date DESC LIMIT 90", (ds_id, sku))
            history = [dict(h) for h in cur.fetchall()]
            history.reverse()

            return 200, {
                "product": dict(prod),
                "recommendation": dict(rec) if rec else None,
                "forecast_run": dict(frun) if frun else None,
                "forecast_points": points,
                "history": history
            }

        # 7. GET /api/datasets/{id}/export.csv
        if len(parts) == 4 and parts[0] == "api" and parts[1] == "datasets" and parts[3] == "export.csv" and method == "GET":
            ds_id = int(parts[2])
            cur.execute("""
                SELECT p.sku, p.name, p.current_stock, r.days_of_cover, r.stockout_date, r.order_qty, r.status, r.lost_revenue, r.message_bn
                FROM products p
                JOIN recommendations r ON p.dataset_id = r.dataset_id AND p.sku = r.sku
                WHERE p.dataset_id = ? AND r.order_qty > 0
                ORDER BY r.lost_revenue DESC
            """, (ds_id,))
            rows = cur.fetchall()

            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["SKU", "Product Name", "Current Stock", "Days of Cover", "Stockout Date", "Order Qty", "Status", "Lost Revenue (BDT)", "Advisory (Bangla)"])
            for r in rows:
                writer.writerow([r["sku"], r["name"], r["current_stock"], r["days_of_cover"], r["stockout_date"], r["order_qty"], r["status"], r["lost_revenue"], r["message_bn"]])

            return 200, output.getvalue(), "text/csv"

        return 404, {"error": "NOT_FOUND", "message_en": "Endpoint not found."}

    finally:
        conn.close()
