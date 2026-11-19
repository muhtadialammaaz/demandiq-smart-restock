"""
DemandIQ Event Multiplier Service
Learns festival and campaign multipliers from past sales occurrences.
Capped between 0.5 and 4.0 as per PRD FR5.
"""

import numpy as np

def calculate_event_multiplier(baseline_avg, event_avg):
    if baseline_avg <= 0 or event_avg <= 0:
        return 1.0
    raw_mult = event_avg / baseline_avg
    # PRD FR5: capped to 0.5 - 4.0
    return float(np.clip(raw_mult, 0.5, 4.0))

def estimate_multipliers_for_dataset(conn, dataset_id):
    cur = conn.cursor()
    # Fetch events for dataset
    cur.execute("SELECT id, name_key, start_date, end_date, manual_multiplier FROM events WHERE dataset_id = ?", (dataset_id,))
    events = cur.fetchall()

    for ev in events:
        eid = ev["id"]
        # If manual multiplier is specified, respect it
        if ev["manual_multiplier"] is not None:
            cur.execute("UPDATE events SET estimated_multiplier = ?, occurrences_used = 1 WHERE id = ?", (ev["manual_multiplier"], eid))
            continue

        # Otherwise estimate from historical sales
        cur.execute("""
            SELECT AVG(qty) as ev_qty
            FROM sales_daily
            WHERE dataset_id = ? AND sale_date >= ? AND sale_date <= ?
        """, (dataset_id, ev["start_date"], ev["end_date"]))
        row = cur.fetchone()
        ev_avg = row["ev_qty"] if row and row["ev_qty"] else None

        cur.execute("""
            SELECT AVG(qty) as base_qty
            FROM sales_daily
            WHERE dataset_id = ? AND (sale_date < ? OR sale_date > ?)
        """, (dataset_id, ev["start_date"], ev["end_date"]))
        base_row = cur.fetchone()
        base_avg = base_row["base_qty"] if base_row and base_row["base_qty"] else 1.0

        if ev_avg and base_avg and base_avg > 0:
            est_mult = calculate_event_multiplier(base_avg, ev_avg)
            occurrences = 1
        else:
            est_mult = 1.0
            occurrences = 0

        cur.execute("""
            UPDATE events
            SET estimated_multiplier = ?, occurrences_used = ?
            WHERE id = ?
        """, (est_mult, occurrences, eid))

    conn.commit()
