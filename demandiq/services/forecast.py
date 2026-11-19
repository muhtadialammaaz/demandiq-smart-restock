"""
DemandIQ Forecasting Service
Implements:
1. Holt-Winters Exponential Smoothing
2. Croston SBA (Syntetos-Boylan Approximation for intermittent items)
3. Seasonal Naive benchmark
4. 28-day backtesting with WAPE and Bias scoring
5. 80% confidence interval bands
"""

import numpy as np

def compute_wape(actual, forecast):
    actual = np.array(actual, dtype=float)
    forecast = np.array(forecast, dtype=float)
    denom = np.sum(actual)
    if denom == 0:
        return 0.0
    return float(np.sum(np.abs(actual - forecast)) / denom)

def compute_bias(actual, forecast):
    actual = np.array(actual, dtype=float)
    forecast = np.array(forecast, dtype=float)
    denom = np.sum(actual)
    if denom == 0:
        return 0.0
    return float(np.sum(forecast - actual) / denom)

def seasonal_naive_forecast(history, horizon, season_length=7):
    if len(history) < season_length:
        mean_val = np.mean(history) if len(history) > 0 else 1.0
        return np.full(horizon, mean_val)
    last_season = history[-season_length:]
    reps = int(np.ceil(horizon / season_length))
    return np.tile(last_season, reps)[:horizon]

def croston_sba(history, horizon, alpha=0.15):
    """
    Croston method with Syntetos-Boylan Approximation (SBA) factor (1 - alpha/2)
    Standard method for intermittent demand in supply chain inventory.
    """
    history = np.array(history, dtype=float)
    non_zeros = np.where(history > 0)[0]
    if len(non_zeros) < 2:
        val = np.mean(history) if len(history) > 0 else 0.5
        return np.full(horizon, max(0.1, val))

    # Calculate intervals and sizes
    intervals = np.diff(non_zeros)
    sizes = history[non_zeros]

    z_hat = sizes[0]
    p_hat = np.mean(intervals) if len(intervals) > 0 else 1.0

    for z, p in zip(sizes[1:], intervals):
        z_hat = alpha * z + (1 - alpha) * z_hat
        p_hat = alpha * p + (1 - alpha) * p_hat

    # SBA correction factor
    demand_rate = (z_hat / max(1.0, p_hat)) * (1.0 - alpha / 2.0)
    return np.full(horizon, max(0.05, demand_rate))

def holt_winters_additive(history, horizon, season_length=7, alpha=0.2, beta=0.1, gamma=0.2):
    """
    Holt-Winters Triple Exponential Smoothing (Additive Seasonality)
    """
    n = len(history)
    if n < season_length * 2:
        return seasonal_naive_forecast(history, horizon, season_length)

    # Initial level & trend
    level = np.mean(history[:season_length])
    trend = (np.mean(history[season_length:2*season_length]) - np.mean(history[:season_length])) / season_length

    # Initial seasonal indices
    seasonals = [history[i] - level for i in range(season_length)]

    for i in range(season_length, n):
        val = history[i]
        last_level = level
        season_idx = i % season_length
        level = alpha * (val - seasonals[season_idx]) + (1 - alpha) * (level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend
        seasonals[season_idx] = gamma * (val - level) + (1 - gamma) * seasonals[season_idx]

    # Forecast
    forecast = []
    for h in range(1, horizon + 1):
        s_idx = (n + h - 1) % season_length
        val = max(0.0, level + h * trend + seasonals[s_idx])
        forecast.append(val)

    return np.array(forecast)

def run_sku_forecast(history, horizon=60, backtest_days=28):
    """
    Backtests Holt-Winters vs Croston vs Naive on held-out 28 days.
    Picks best model and produces 60-day forecast with 80% confidence bands.
    """
    history = np.array(history, dtype=float)
    total_days = len(history)

    if total_days <= backtest_days:
        # Fallback if history is short
        train = history
        test = history
        backtest_days = 0
    else:
        train = history[:-backtest_days]
        test = history[-backtest_days:]

    # Backtest candidate models
    naive_pred = seasonal_naive_forecast(train, len(test))
    wape_naive = compute_wape(test, naive_pred)

    hw_pred = holt_winters_additive(train, len(test))
    wape_hw = compute_wape(test, hw_pred)

    croston_pred = croston_sba(train, len(test))
    wape_croston = compute_wape(test, croston_pred)

    # Selection logic: Pick lowest WAPE
    candidates = [
        ("Holt-Winters Additive", wape_hw, hw_pred),
        ("Croston SBA", wape_croston, croston_pred),
        ("Seasonal Naive", wape_naive, naive_pred)
    ]
    candidates.sort(key=lambda x: x[1])
    best_model_name, best_wape, best_test_pred = candidates[0]
    best_bias = compute_bias(test, best_test_pred)

    # Now forecast full horizon from full history using winning model
    if "Holt-Winters" in best_model_name:
        yhat = holt_winters_additive(history, horizon)
    elif "Croston" in best_model_name:
        yhat = croston_sba(history, horizon)
    else:
        yhat = seasonal_naive_forecast(history, horizon)

    # Compute residuals & sigma for 80% band (z = 1.282)
    residuals = test - best_test_pred if len(test) > 0 else np.array([1.0])
    sigma_daily = float(np.std(residuals)) if len(residuals) > 1 else 1.0
    z_80 = 1.282

    lo_band = np.maximum(0.0, yhat - z_80 * sigma_daily)
    hi_band = yhat + z_80 * sigma_daily

    return {
        "model_used": best_model_name,
        "wape_model": best_wape,
        "wape_naive": wape_naive,
        "bias": best_bias,
        "sigma_daily": sigma_daily,
        "yhat": yhat.tolist(),
        "lo": lo_band.tolist(),
        "hi": hi_band.tolist()
    }
