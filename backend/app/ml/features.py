"""
Turn raw NASA POWER hourly weather into the full feature set the model
trains on: measured horizontal-plane irradiance, derived tilted irradiance
(GTI), a cloud-opacity ratio, and cyclical time-of-year/time-of-day encodings.
"""
import numpy as np
import pandas as pd

from app.ml.transposition import add_gti_column, optimal_tilt_for_latitude

FEATURE_COLUMNS = [
    "ghi", "dni", "dhi", "gti", "cloud_amt", "cloud_opacity",
    "temp_air", "wind_speed", "rel_humidity", "precip", "albedo", "pressure",
    "hour_sin", "hour_cos", "doy_sin", "doy_cos",
]


def engineer_features(
    df: pd.DataFrame,
    latitude: float,
    longitude: float,
    tilt_deg: float | None = None,
    azimuth_deg: float = 180.0,
) -> pd.DataFrame:
    out = df.copy()
    tilt = tilt_deg if tilt_deg is not None else optimal_tilt_for_latitude(latitude)

    out = add_gti_column(out, latitude=latitude, longitude=longitude, tilt_deg=tilt, azimuth_deg=azimuth_deg)

    # Cloud opacity: how much all-sky irradiance is attenuated relative to a
    # clear sky (0 = clear, 1 = fully opaque). This is the "cloud opacity"
    # factor the original project used as a training input.
    out["cloud_opacity"] = 1 - (out["ghi"] / out["clearsky_ghi"].replace(0, np.nan))
    out["cloud_opacity"] = out["cloud_opacity"].clip(0, 1).fillna(0)

    hour = out.index.hour + out.index.minute / 60
    doy = out.index.dayofyear
    out["hour_sin"] = np.sin(2 * np.pi * hour / 24)
    out["hour_cos"] = np.cos(2 * np.pi * hour / 24)
    out["doy_sin"] = np.sin(2 * np.pi * doy / 365.25)
    out["doy_cos"] = np.cos(2 * np.pi * doy / 365.25)

    return out
