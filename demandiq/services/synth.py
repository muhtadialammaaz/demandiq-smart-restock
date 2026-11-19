"""
DemandIQ Synthetic Sample Dataset Generator (PRD F1)
Generates 10-50 realistic Bangladeshi SKUs with Eid & Boishakh seasonality.
"""

from datetime import datetime, timedelta
import random
import numpy as np

def generate_sample_dataset(conn, name="রহিমের ফ্যাশন স্টোর (Rahim F-Commerce)", num_skus=10):
    cur = conn.cursor()

    # 1. Insert dataset metadata
    cur.execute("""
        INSERT INTO datasets (name, source, is_synthetic, currency, min_date, max_date)
        VALUES (?, 'sample', 1, 'BDT', '2023-01-01', '2024-04-14')
    """, (name,))
    dataset_id = cur.lastrowid

    # 2. Insert default settings
    cur.execute("""
        INSERT INTO settings (dataset_id, service_level, review_period_days, target_cover_days, horizon_days, backtest_days, default_margin, language)
        VALUES (?, 0.90, 7, 45, 60, 28, 0.30, 'bn')
    """, (dataset_id,))

    # 3. Insert default cultural events
    events = [
        ("eid_ul_fitr", "ঈদুল ফিতর (Eid-ul-Fitr)", "2024-03-25", "2024-04-11", 2.8),
        ("pohela_boishakh", "পহেলা বৈশাখ (Pohela Boishakh)", "2024-04-10", "2024-04-14", 1.9),
        ("mega_sale_11_11", "১১.১১ মেগা সেল", "2023-11-08", "2023-11-12", 3.2)
    ]
    for ev in events:
        cur.execute("""
            INSERT INTO events (dataset_id, name_key, label, start_date, end_date, manual_multiplier, estimated_multiplier, occurrences_used, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'default')
        """, (dataset_id, ev[0], ev[1], ev[2], ev[3], ev[4], ev[4]))

    # 4. Catalog of authentic Bangladeshi products
    catalog = [
        {"sku": "PANJABI-001", "name": "Premium Cotton Panjabi White", "cat": "Fashion", "price": 1850, "cost": 1250, "stock": 4, "lead": 7, "moq": 25, "base_d": 5},
        {"sku": "SAREE-002", "name": "Dhakai Jamdani Saree Crimson", "cat": "Festive", "price": 4500, "cost": 3100, "stock": 2, "lead": 10, "moq": 10, "base_d": 2},
        {"sku": "KABLI-006", "name": "Royal Kabli Suit Charcoal", "cat": "Fashion", "price": 2950, "cost": 1950, "stock": 5, "lead": 8, "moq": 15, "base_d": 3},
        {"sku": "KURTI-003", "name": "Floral Embroidered Kurti", "cat": "Women Wear", "price": 1200, "cost": 800, "stock": 14, "lead": 5, "moq": 30, "base_d": 4},
        {"sku": "POLO-004", "name": "Classic Pique Polo Navy", "cat": "Casuals", "price": 850, "cost": 550, "stock": 78, "lead": 7, "moq": 50, "base_d": 3},
        {"sku": "JEANS-007", "name": "Slim Stretch Denim Jeans", "cat": "Denim", "price": 1650, "cost": 1100, "stock": 65, "lead": 14, "moq": 25, "base_d": 2},
        {"sku": "TSHIRT-005", "name": "Urban Graphic Tee Olive", "cat": "Casuals", "price": 650, "cost": 420, "stock": 165, "lead": 5, "moq": 50, "base_d": 1.5},
        {"sku": "WINTER-010", "name": "Warm Fleece Hoodie Grey", "cat": "Winter", "price": 1450, "cost": 750, "stock": 78, "lead": 10, "moq": 30, "base_d": 0.05}
    ]

    start_date = datetime(2023, 10, 1)
    end_date = datetime(2024, 4, 1)
    day_count = (end_date - start_date).days

    for item in catalog[:num_skus]:
        cur.execute("""
            INSERT INTO products (dataset_id, sku, name, category, unit_price, unit_cost, current_stock, on_order, lead_time_days, moq)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        """, (dataset_id, item["sku"], item["name"], item["cat"], item["price"], item["cost"], item["stock"], item["lead"], item["moq"]))

        # Generate sales series
        for d in range(day_count):
            curr_dt = start_date + timedelta(days=d)
            dt_str = curr_dt.strftime("%Y-%m-%d")

            # Day of week seasonality
            dow = curr_dt.weekday()
            weekend_boost = 1.35 if dow in (4, 5) else 1.0 # Friday/Saturday in BD

            # Ramadan/Eid boost
            eid_boost = 1.0
            if "2024-03-20" <= dt_str <= "2024-04-10":
                eid_boost = 2.6 if "PANJABI" in item["sku"] or "SAREE" in item["sku"] else 1.5

            lam = max(0.05, item["base_d"] * weekend_boost * eid_boost)
            qty = np.random.poisson(lam)
            if qty > 0:
                rev = qty * item["price"]
                cur.execute("""
                    INSERT INTO sales_daily (dataset_id, sku, sale_date, qty, revenue)
                    VALUES (?, ?, ?, ?, ?)
                """, (dataset_id, item["sku"], dt_str, int(qty), float(rev)))

    conn.commit()
    return dataset_id
