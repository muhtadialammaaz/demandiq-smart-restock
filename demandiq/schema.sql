-- DemandIQ Smart Restock Database Schema
-- Matches PRD v1.0 Section 7 (SQLite with Foreign Keys)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('sample', 'upload')),
    is_synthetic INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'BDT',
    min_date TEXT,
    max_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    unit_price REAL NOT NULL,
    unit_cost REAL NOT NULL,
    cost_is_assumed INTEGER NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    on_order INTEGER NOT NULL DEFAULT 0,
    lead_time_days INTEGER NOT NULL DEFAULT 7,
    moq INTEGER NOT NULL DEFAULT 1,
    UNIQUE (dataset_id, sku)
);

CREATE TABLE IF NOT EXISTS sales_daily (
    dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    sale_date TEXT NOT NULL,
    qty INTEGER NOT NULL,
    revenue REAL NOT NULL,
    PRIMARY KEY (dataset_id, sku, sale_date)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    name_key TEXT NOT NULL,
    label TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    manual_multiplier REAL,
    estimated_multiplier REAL,
    occurrences_used INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'default'))
);

CREATE TABLE IF NOT EXISTS settings (
    dataset_id INTEGER PRIMARY KEY REFERENCES datasets(id) ON DELETE CASCADE,
    service_level REAL NOT NULL DEFAULT 0.90,
    review_period_days INTEGER NOT NULL DEFAULT 7,
    target_cover_days INTEGER NOT NULL DEFAULT 45,
    horizon_days INTEGER NOT NULL DEFAULT 60,
    backtest_days INTEGER NOT NULL DEFAULT 28,
    default_margin REAL NOT NULL DEFAULT 0.30,
    language TEXT NOT NULL DEFAULT 'bn'
);

CREATE TABLE IF NOT EXISTS forecast_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    run_at TEXT NOT NULL DEFAULT (datetime('now')),
    as_of TEXT NOT NULL,
    model_used TEXT NOT NULL,
    wape_model REAL,
    wape_naive REAL,
    bias REAL,
    sigma_daily REAL NOT NULL DEFAULT 0,
    history_days INTEGER NOT NULL,
    warnings TEXT
);

CREATE TABLE IF NOT EXISTS forecast_points (
    run_id INTEGER NOT NULL REFERENCES forecast_runs(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    yhat REAL NOT NULL,
    lo REAL NOT NULL,
    hi REAL NOT NULL,
    event_factor REAL NOT NULL DEFAULT 1.0,
    PRIMARY KEY (run_id, day)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS recommendations (
    run_id INTEGER PRIMARY KEY REFERENCES forecast_runs(id) ON DELETE CASCADE,
    dataset_id INTEGER NOT NULL,
    sku TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('critical', 'soon', 'ok', 'overstock', 'dead')),
    inventory_class TEXT NOT NULL CHECK (inventory_class IN ('fast', 'healthy', 'slow', 'dead')),
    days_of_cover REAL,
    stockout_date TEXT,
    order_qty INTEGER NOT NULL DEFAULT 0,
    units_short INTEGER NOT NULL DEFAULT 0,
    lost_revenue REAL NOT NULL DEFAULT 0,
    lost_margin REAL NOT NULL DEFAULT 0,
    cash_tied_up REAL NOT NULL DEFAULT 0,
    message_bn TEXT,
    message_en TEXT
);

CREATE INDEX IF NOT EXISTS idx_sales_ds_sku ON sales_daily (dataset_id, sku);
CREATE INDEX IF NOT EXISTS idx_rec_ds_status ON recommendations (dataset_id, status);
