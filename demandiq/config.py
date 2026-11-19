"""
DemandIQ Smart Restock Configuration
"""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "demandiq.sqlite3")
SCHEMA_PATH = os.path.join(BASE_DIR, "schema.sql")
SAMPLE_DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "sample_data")

DEFAULT_SETTINGS = {
    "service_level": 0.90,
    "review_period_days": 7,
    "target_cover_days": 45,
    "horizon_days": 60,
    "backtest_days": 28,
    "default_margin": 0.30,
    "language": "bn",
    "currency": "BDT"
}

DEFAULT_EVENTS = [
    {
        "name_key": "eid_ul_fitr",
        "label": "ঈদুল ফিতর (Eid-ul-Fitr)",
        "start_date": "2024-03-25",
        "end_date": "2024-04-11",
        "manual_multiplier": 2.8
    },
    {
        "name_key": "pohela_boishakh",
        "label": "পহেলা বৈশাখ (Pohela Boishakh)",
        "start_date": "2024-04-10",
        "end_date": "2024-04-14",
        "manual_multiplier": 1.9
    },
    {
        "name_key": "eid_ul_adha",
        "label": "ঈদুল আযহা (Eid-ul-Adha)",
        "start_date": "2024-06-10",
        "end_date": "2024-06-18",
        "manual_multiplier": 2.4
    },
    {
        "name_key": "mega_sale_11_11",
        "label": "১১.১১ মেগা সেল (11.11 Mega Sale)",
        "start_date": "2024-11-08",
        "end_date": "2024-11-12",
        "manual_multiplier": 3.2
    }
]
