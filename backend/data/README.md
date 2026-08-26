# Historical irradiance data

This directory holds the historical hourly weather/irradiance CSVs the
training pipeline (`scripts/fetch_nasa_power.py`, `notebooks/train_model...`)
consumes. They are gitignored because of size — regenerate them with the
steps below.

## Why this is a manual step

The dev sandbox this project was scaffolded in only allows outbound network
access to package registries (PyPI, npm, GitHub) — general APIs like NASA
POWER, Solcast, or Open-Meteo are blocked at the network layer. A normal
laptop/CI machine has no such restriction, so `scripts/fetch_nasa_power.py`
will work as-is once you run it somewhere with normal internet access.

## Option A — run the fetch script (preferred once you have normal internet)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m scripts.fetch_nasa_power --start 2014-01-01 --end 2023-12-31
```

This writes `nasa_power_bangalore_2014_2023.csv` and
`nasa_power_mumbai_2014_2023.csv` here.

## Option B — one-click browser download (no code needed)

NASA POWER's hourly endpoint rejects a 10-year CSV request in one shot
("please shorten your requested time extent for a CSV formatted data
request") — confirmed against the live API. It's fine with one calendar
year at a time, so download year-by-year instead (5 years, matching the
original project's scope, x 2 cities = 10 files). Paste each URL into a
browser address bar; it triggers a CSV download directly, no signup needed.
Save each with the filename shown, then upload all 10 back to Claude to be
merged and processed.

### Bangalore

| Save as | URL |
|---|---|
| `nasa_power_bangalore_2019.csv` | `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF,CLOUD_AMT,T2M,WS10M,RH2M,PRECTOTCORR,ALLSKY_SRF_ALB,PS&community=RE&longitude=77.5946&latitude=12.9716&start=20190101&end=20191231&format=CSV` |
| `nasa_power_bangalore_2020.csv` | `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF,CLOUD_AMT,T2M,WS10M,RH2M,PRECTOTCORR,ALLSKY_SRF_ALB,PS&community=RE&longitude=77.5946&latitude=12.9716&start=20200101&end=20201231&format=CSV` |
| `nasa_power_bangalore_2021.csv` | `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF,CLOUD_AMT,T2M,WS10M,RH2M,PRECTOTCORR,ALLSKY_SRF_ALB,PS&community=RE&longitude=77.5946&latitude=12.9716&start=20210101&end=20211231&format=CSV` |
| `nasa_power_bangalore_2022.csv` | `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF,CLOUD_AMT,T2M,WS10M,RH2M,PRECTOTCORR,ALLSKY_SRF_ALB,PS&community=RE&longitude=77.5946&latitude=12.9716&start=20220101&end=20221231&format=CSV` |
| `nasa_power_bangalore_2023.csv` | `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF,CLOUD_AMT,T2M,WS10M,RH2M,PRECTOTCORR,ALLSKY_SRF_ALB,PS&community=RE&longitude=77.5946&latitude=12.9716&start=20230101&end=20231231&format=CSV` |

### Mumbai

| Save as | URL |
|---|---|
| `nasa_power_mumbai_2019.csv` | `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF,CLOUD_AMT,T2M,WS10M,RH2M,PRECTOTCORR,ALLSKY_SRF_ALB,PS&community=RE&longitude=72.8777&latitude=19.0760&start=20190101&end=20191231&format=CSV` |
| `nasa_power_mumbai_2020.csv` | `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF,CLOUD_AMT,T2M,WS10M,RH2M,PRECTOTCORR,ALLSKY_SRF_ALB,PS&community=RE&longitude=72.8777&latitude=19.0760&start=20200101&end=20201231&format=CSV` |
| `nasa_power_mumbai_2021.csv` | `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF,CLOUD_AMT,T2M,WS10M,RH2M,PRECTOTCORR,ALLSKY_SRF_ALB,PS&community=RE&longitude=72.8777&latitude=19.0760&start=20210101&end=20211231&format=CSV` |
| `nasa_power_mumbai_2022.csv` | `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF,CLOUD_AMT,T2M,WS10M,RH2M,PRECTOTCORR,ALLSKY_SRF_ALB,PS&community=RE&longitude=72.8777&latitude=19.0760&start=20220101&end=20221231&format=CSV` |
| `nasa_power_mumbai_2023.csv` | `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF,CLOUD_AMT,T2M,WS10M,RH2M,PRECTOTCORR,ALLSKY_SRF_ALB,PS&community=RE&longitude=72.8777&latitude=19.0760&start=20230101&end=20231231&format=CSV` |

## Option C — Solcast (if you land a student/researcher API key)

Swap the fetch source: Solcast's Historical Time Series endpoint returns the
same GHI/DNI/DHI/cloud-opacity-shaped fields under different parameter names.
Ping Claude with the key and this becomes a ~10-line change in
`scripts/fetch_nasa_power.py` (or a parallel `fetch_solcast.py`).

## Once the CSVs are here

Re-run (once written) `scripts/build_climatology.py` to produce
`climatology_<city>.json` files consumed by the API's `/predict` endpoint —
this is what upgrades the app from the seed placeholder numbers to real
data-derived predictions.
