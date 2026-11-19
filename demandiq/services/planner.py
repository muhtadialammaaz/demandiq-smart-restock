"""
DemandIQ Reorder & Money at Risk Engine
Implements PRD FR8, FR9, FR10:
- Safety stock with z-score (scipy.stats.norm)
- Order quantity respecting MOQ and lead time
- Days of cover and exact stock-out date
- Status classification: critical, soon, ok, overstock, dead
- Money at risk (lost sales exposure in Taka and cash tied up in dead stock)
"""

import math
from datetime import datetime, timedelta
import numpy as np
from scipy.stats import norm

def calculate_safety_stock(sigma_daily, lead_time_days, service_level=0.90):
    z = norm.ppf(service_level)
    ss = z * sigma_daily * math.sqrt(lead_time_days)
    return max(0, math.ceil(ss))

def plan_sku_reorder(product, forecast_points, settings, as_of_date_str=None):
    """
    Simulates inventory drawdown over forecast horizon and generates recommendations.
    """
    current_stock = product["current_stock"]
    on_order = product["on_order"]
    lead_time = product["lead_time_days"]
    moq = max(1, product["moq"])
    unit_price = product["unit_price"]
    unit_cost = product["unit_cost"]
    
    service_level = settings.get("service_level", 0.90)
    review_period = settings.get("review_period_days", 7)
    target_cover_days = settings.get("target_cover_days", 45)
    default_margin = settings.get("default_margin", 0.30)

    if as_of_date_str:
        as_of = datetime.strptime(as_of_date_str, "%Y-%m-%d")
    else:
        as_of = datetime.now()

    # Mean daily demand
    yhat = forecast_points["yhat"]
    sigma_daily = forecast_points["sigma_daily"]
    mean_daily_demand = max(0.01, float(np.mean(yhat)))

    # 1. Days of cover
    days_of_cover = current_stock / mean_daily_demand

    # 2. Simulate drawdown to find stockout date and units short
    running_stock = current_stock + on_order
    stockout_day_offset = None
    units_short = 0

    for idx, demand in enumerate(yhat):
        running_stock -= demand
        if running_stock <= 0:
            if stockout_day_offset is None:
                stockout_day_offset = idx + 1
            units_short += abs(running_stock)
            running_stock = 0

    if stockout_day_offset is not None:
        stockout_dt = as_of + timedelta(days=stockout_day_offset)
        stockout_date = stockout_dt.strftime("%Y-%m-%d")
    else:
        stockout_date = (as_of + timedelta(days=len(yhat))).strftime("%Y-%m-%d")

    # 3. Safety stock and Order Quantity
    ss = calculate_safety_stock(sigma_daily, lead_time, service_level)
    target_inventory = (mean_daily_demand * (lead_time + review_period)) + ss
    net_stock = current_stock + on_order
    raw_order_needed = max(0, target_inventory - net_stock)

    if raw_order_needed > 0:
        # Respect MOQ
        order_qty = int(math.ceil(raw_order_needed / moq) * moq)
    else:
        order_qty = 0

    # 4. Status and Inventory Class
    if stockout_day_offset is not None and stockout_day_offset <= lead_time:
        status = "critical"
        inv_class = "fast"
    elif stockout_day_offset is not None and stockout_day_offset <= (lead_time + review_period):
        status = "soon"
        inv_class = "fast"
    elif days_of_cover > target_cover_days:
        status = "overstock"
        inv_class = "slow"
    elif mean_daily_demand < 0.05:
        status = "dead"
        inv_class = "dead"
    else:
        status = "ok"
        inv_class = "healthy"

    # 5. Money at Risk (PRD FR9 & Section 5.1)
    if status in ("critical", "soon"):
        lost_rev = float(units_short * unit_price)
        lost_marg = float(lost_rev * default_margin)
        cash_tied = 0.0
    elif status in ("overstock", "dead"):
        lost_rev = 0.0
        lost_marg = 0.0
        excess_units = max(0, current_stock - math.ceil(mean_daily_demand * target_cover_days))
        cash_tied = float(excess_units * unit_cost)
    else:
        lost_rev = 0.0
        lost_marg = 0.0
        cash_tied = 0.0

    return {
        "status": status,
        "inventory_class": inv_class,
        "days_of_cover": round(days_of_cover, 1),
        "stockout_date": stockout_date,
        "order_qty": order_qty,
        "units_short": int(math.ceil(units_short)),
        "lost_revenue": round(lost_rev, 2),
        "lost_margin": round(lost_marg, 2),
        "cash_tied_up": round(cash_tied, 2)
    }
