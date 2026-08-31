"""
Live prediction path for the API: run the trained neural net against each
city's precomputed month x hour typical-weather profile, and aggregate to
monthly/annual specific yield (kWh per kWp). Falls back gracefully if model
artifacts aren't present yet.
"""
import json
from calendar import monthrange
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd

import logging
from app.ml.model import INPUT_FEATURES, MODELS_DIR, load_artifacts, predict_specific_power

logger = logging.getLogger(__name__)
from app.ml.transposition import add_gti_column, optimal_tilt_for_latitude

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


@lru_cache(maxsize=1)
def _get_model():
    logger.info(f"Loading model from: {MODELS_DIR}")
    logger.info(f"MODELS_DIR exists: {MODELS_DIR.exists()}")
    if MODELS_DIR.exists():
        logger.info(f"Files in MODELS_DIR: {list(MODELS_DIR.glob('*'))}")
    artifacts = load_artifacts()
    if artifacts is None:
        logger.warning("Model artifacts not found - will fall back to climatology")
    else:
        logger.info("Model artifacts loaded successfully")
    return artifacts


@lru_cache(maxsize=8)
def _get_typical_profile(city_key: str) -> pd.DataFrame | None:
    path = DATA_DIR / f"typical_profile_{city_key}.json"
    if not path.exists():
        return None
    return pd.DataFrame(json.loads(path.read_text()))


def _recompute_gti_for_tilt(
    profile: pd.DataFrame, latitude: float, longitude: float, tilt_deg: float, azimuth_deg: float
) -> pd.DataFrame:
    """The typical profile stores GHI/DNI/DHI (tilt-independent) alongside a
    default-tilt GTI. When the request asks for a non-default tilt/azimuth,
    re-run the transposition against representative mid-month timestamps so
    the panel-angle inputs on the UI actually change the prediction."""
    df = profile.copy()
    representative_year = 2023  # arbitrary non-leap reference year
    df["timestamp"] = [
        pd.Timestamp(year=representative_year, month=int(m), day=15, hour=int(h), tz="Asia/Kolkata")
        for m, h in zip(df["month"], df["hour"])
    ]
    df = df.set_index("timestamp")
    df = add_gti_column(
        df, latitude=latitude, longitude=longitude, tilt_deg=tilt_deg, azimuth_deg=azimuth_deg
    )
    return df.reset_index(drop=True)


def monthly_specific_yield_kwh_per_kwp(
    city_key: str,
    latitude: float,
    longitude: float,
    tilt_deg: float | None = None,
    azimuth_deg: float = 180.0,
    year: int = 2023,
) -> list[float] | None:
    """Returns 12 monthly kWh/kWp figures from live NN inference over the
    city's typical month x hour weather profile, or None if unavailable."""
    artifacts = _get_model()
    profile = _get_typical_profile(city_key)
    if artifacts is None or profile is None:
        return None
    model, scaler = artifacts

    tilt = tilt_deg if tilt_deg is not None else optimal_tilt_for_latitude(latitude)
    df = _recompute_gti_for_tilt(profile, latitude, longitude, tilt, azimuth_deg)
    df["latitude"] = latitude
    X = df[INPUT_FEATURES].to_numpy(dtype=np.float64)
    specific_power_w = predict_specific_power(model, scaler, X)  # W per kWp, one per (month, hour)
    df["specific_power_w"] = specific_power_w

    monthly = []
    for month in range(1, 13):
        days = monthrange(year, month)[1]
        avg_hourly_w = df.loc[df["month"] == month, "specific_power_w"].mean()
        monthly.append(avg_hourly_w * 24 * days / 1000.0)  # kWh/kWp for the month
    return monthly


def model_is_ready() -> bool:
    return _get_model() is not None
