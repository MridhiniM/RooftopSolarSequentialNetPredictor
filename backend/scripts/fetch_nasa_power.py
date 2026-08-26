"""
Fetch historical hourly weather/irradiance data from the NASA POWER API for
each supported city and cache it as CSV under backend/data/.

Run this from a machine with normal internet access (NASA POWER is not
reachable from some sandboxed dev environments):

    python -m scripts.fetch_nasa_power --start 2014-01-01 --end 2023-12-31

NASA POWER's hourly endpoint may reject very large date ranges in one call;
this script chunks requests by calendar year and concatenates the results,
which is both safer and easier to resume if one year's request fails.
"""
import argparse
import datetime as dt
import sys
import time
from pathlib import Path

import pandas as pd
import requests

sys.path.append(str(Path(__file__).resolve().parents[1]))
from app.config import SUPPORTED_CITIES  # noqa: E402

BASE_URL = "https://power.larc.nasa.gov/api/temporal/hourly/point"

# Kept to <=15 per NASA POWER's per-request parameter cap.
PARAMETERS = [
    "ALLSKY_SFC_SW_DWN",   # GHI
    "CLRSKY_SFC_SW_DWN",   # Clear-sky GHI (used to derive cloud opacity ratio)
    "ALLSKY_SFC_SW_DNI",   # DNI
    "ALLSKY_SFC_SW_DIFF",  # DHI
    "CLOUD_AMT",           # Cloud amount (%)
    "T2M",                 # Temperature at 2m (deg C)
    "WS10M",               # Wind speed at 10m (m/s)
    "RH2M",                # Relative humidity at 2m (%)
    "PRECTOTCORR",         # Precipitation (mm/hr)
    "ALLSKY_SRF_ALB",      # Surface albedo
    "PS",                  # Surface pressure (kPa)
]

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def fetch_year(lat: float, lon: float, year: int) -> pd.DataFrame:
    params = {
        "parameters": ",".join(PARAMETERS),
        "community": "RE",
        "longitude": lon,
        "latitude": lat,
        "start": f"{year}0101",
        "end": f"{year}1231",
        "format": "JSON",
    }
    resp = requests.get(BASE_URL, params=params, timeout=120)
    resp.raise_for_status()
    payload = resp.json()["properties"]["parameter"]

    df = pd.DataFrame({param: pd.Series(values) for param, values in payload.items()})
    df.index = pd.to_datetime(df.index, format="%Y%m%d%H")
    df.index.name = "timestamp_utc"
    return df


def fetch_city(city_key: str, start_year: int, end_year: int) -> pd.DataFrame:
    city = SUPPORTED_CITIES[city_key]
    frames = []
    for year in range(start_year, end_year + 1):
        print(f"  fetching {city.name} {year}...")
        frames.append(fetch_year(city.latitude, city.longitude, year))
        time.sleep(1)  # be polite to the API
    return pd.concat(frames).sort_index()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", default="2019-01-01")
    parser.add_argument("--end", default="2023-12-31")
    args = parser.parse_args()

    start_year = dt.date.fromisoformat(args.start).year
    end_year = dt.date.fromisoformat(args.end).year

    DATA_DIR.mkdir(exist_ok=True)
    for city_key in SUPPORTED_CITIES:
        print(f"Fetching {city_key} ({start_year}-{end_year})...")
        df = fetch_city(city_key, start_year, end_year)
        out_path = DATA_DIR / f"nasa_power_{city_key}_{start_year}_{end_year}.csv"
        df.to_csv(out_path)
        print(f"  saved {len(df):,} rows -> {out_path}")


if __name__ == "__main__":
    main()
