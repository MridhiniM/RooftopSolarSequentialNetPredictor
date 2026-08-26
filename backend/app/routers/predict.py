import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import SUPPORTED_CITIES
from app.ml import physics
from app.ml.inference import monthly_specific_yield_kwh_per_kwp
from app.ml.seed_climatology import MONTHS, seed_monthly_gti_kwh_m2
from app.ml.transposition import optimal_tilt_for_latitude
from app.schemas import CityOut, MonthlyGeneration, PredictRequest, PredictResponse

router = APIRouter()

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


@router.get("/cities", response_model=list[CityOut])
def list_cities():
    return [
        CityOut(key=key, name=c.name, latitude=c.latitude, longitude=c.longitude)
        for key, c in SUPPORTED_CITIES.items()
    ]


def _monthly_generation_kwh(city_key, city, usable_area_kwp, tilt, azimuth, req):
    """Layered fallback: live trained-model inference -> precomputed
    climatology summary -> labeled seed placeholder. Each returns
    (monthly_generation_kwh, model_source)."""
    # 1. Live neural net inference over the city's typical weather profile,
    #    tilt/azimuth-aware.
    monthly_yield = monthly_specific_yield_kwh_per_kwp(
        city_key, city.latitude, city.longitude, tilt_deg=req.tilt_deg, azimuth_deg=azimuth
    )
    if monthly_yield is not None:
        return [usable_area_kwp * y for y in monthly_yield], "trained_model"

    # 2. Precomputed monthly climatology (built from the real dataset, but
    #    without live tilt-sensitivity or model inference).
    climatology_path = DATA_DIR / f"climatology_{city_key}.json"
    if climatology_path.exists():
        payload = json.loads(climatology_path.read_text())
        monthly_gti = payload["monthly_gti_kwh_m2"]
        return [physics.physical_energy_kwh(usable_area_kwp, g) for g in monthly_gti], "climatology_fallback"

    # 3. Seed placeholder (pre-data-upload state).
    monthly_gti = seed_monthly_gti_kwh_m2(city_key)
    return (
        [physics.physical_energy_kwh(usable_area_kwp, g) for g in monthly_gti],
        "physics_fallback_seed_climatology",
    )


@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    city_key = req.city.lower().strip()
    if city_key not in SUPPORTED_CITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported city '{req.city}'. Supported: {list(SUPPORTED_CITIES)}",
        )
    city = SUPPORTED_CITIES[city_key]

    tilt = req.tilt_deg if req.tilt_deg is not None else optimal_tilt_for_latitude(city.latitude)
    azimuth = req.azimuth_deg if req.azimuth_deg is not None else 180.0

    usable_area = physics.usable_roof_area_m2(req.roof_area_m2)
    capacity_kwp = physics.installed_capacity_kwp(usable_area)

    monthly_gen, model_source = _monthly_generation_kwh(city_key, city, capacity_kwp, tilt, azimuth, req)
    annual_kwh = sum(monthly_gen)

    fin = physics.financial_summary(
        usable_area_m2=usable_area,
        annual_generation_kwh=annual_kwh,
        electricity_tariff_inr_per_kwh=city.electricity_tariff_inr_per_kwh,
    )

    return PredictResponse(
        city=city.name,
        usable_area_m2=round(usable_area, 2),
        capacity_kwp=fin.capacity_kwp,
        annual_generation_kwh=fin.annual_generation_kwh,
        monthly_generation=[
            MonthlyGeneration(month=m, generation_kwh=round(g, 2))
            for m, g in zip(MONTHS, monthly_gen)
        ],
        install_cost_inr=fin.install_cost_inr,
        annual_savings_inr=fin.annual_savings_inr,
        savings_5yr_inr=fin.savings_5yr_inr,
        savings_10yr_inr=fin.savings_10yr_inr,
        payback_period_years=fin.payback_period_years,
        model_source=model_source,
    )
