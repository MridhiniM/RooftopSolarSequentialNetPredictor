"""
Load raw NASA POWER hourly CSVs (one per city per year), clean them, and
merge into a single tz-aware hourly dataframe per city spanning all years.
"""
from pathlib import Path

import numpy as np
import pandas as pd

from app.config import SUPPORTED_CITIES

DATA_DIR = Path(__file__).resolve().parents[2] / "data"

RAW_COLUMNS = [
    "ALLSKY_SFC_SW_DWN", "CLRSKY_SFC_SW_DWN", "ALLSKY_SFC_SW_DNI",
    "ALLSKY_SFC_SW_DIFF", "CLOUD_AMT", "T2M", "WS10M", "RH2M",
    "PRECTOTCORR", "ALLSKY_SRF_ALB", "PS",
]

RENAME = {
    "ALLSKY_SFC_SW_DWN": "ghi",
    "CLRSKY_SFC_SW_DWN": "clearsky_ghi",
    "ALLSKY_SFC_SW_DNI": "dni",
    "ALLSKY_SFC_SW_DIFF": "dhi",
    "CLOUD_AMT": "cloud_amt",
    "T2M": "temp_air",
    "WS10M": "wind_speed",
    "RH2M": "rel_humidity",
    "PRECTOTCORR": "precip",
    "ALLSKY_SRF_ALB": "albedo",
    "PS": "pressure",
}


def _read_one_year_csv(path: Path) -> pd.DataFrame:
    """NASA POWER CSVs have a variable-length metadata header ending in a
    '-END HEADER-' line, followed by the real CSV header/data."""
    with open(path) as f:
        lines = f.readlines()
    header_end = next(i for i, line in enumerate(lines) if "END HEADER" in line)
    from io import StringIO
    df = pd.read_csv(StringIO("".join(lines[header_end + 1:])))
    return df


def load_city_hourly(city_key: str) -> pd.DataFrame:
    """Load and concatenate every yearly CSV found for a city, clean missing
    sentinels, and return an hourly-indexed dataframe (Asia/Kolkata local
    solar time, as reported by NASA POWER's LST hourly product)."""
    files = sorted(DATA_DIR.glob(f"nasa_power_{city_key}_*.csv"))
    if not files:
        raise FileNotFoundError(f"No NASA POWER CSVs found for '{city_key}' in {DATA_DIR}")

    frames = [_read_one_year_csv(f) for f in files]
    df = pd.concat(frames, ignore_index=True)

    df["timestamp"] = pd.to_datetime(
        dict(year=df["YEAR"], month=df["MO"], day=df["DY"], hour=df["HR"])
    )
    df = df.set_index("timestamp").sort_index()
    # NASA POWER's hourly "LST" is Local Standard Time -- IST (UTC+5:30) for
    # all of India. pvlib's solar-position calc needs a tz-aware index or it
    # silently assumes UTC, which would misalign every irradiance reading
    # with the sun's actual position by 5.5 hours.
    df.index = df.index.tz_localize("Asia/Kolkata")
    df = df[RAW_COLUMNS].rename(columns=RENAME)

    # NASA POWER uses -999 as a missing-data sentinel.
    df = df.astype(float)
    df = df.replace(-999.0, np.nan)
    df = df.interpolate(limit=6).ffill().bfill()

    # Irradiance fields are reported as Wh/m^2 accumulated over the hour,
    # which is numerically identical to an average W/m^2 for that hour --
    # convenient, since it means a plain sum over hours gives Wh directly.
    return df


def load_all_cities() -> dict[str, pd.DataFrame]:
    return {city_key: load_city_hourly(city_key) for city_key in SUPPORTED_CITIES}
