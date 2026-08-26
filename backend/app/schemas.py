from typing import Optional

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    city: str = Field(..., description="One of the supported city keys, e.g. 'bangalore'")
    roof_area_m2: float = Field(..., gt=0, description="Raw rooftop polygon area drawn on the map, in m^2")
    tilt_deg: Optional[float] = Field(
        None, description="Panel tilt in degrees. Defaults to the site's optimal (latitude) tilt if omitted."
    )
    azimuth_deg: Optional[float] = Field(
        180.0, description="Panel azimuth in degrees, 180 = true south (optimal for India)."
    )


class MonthlyGeneration(BaseModel):
    month: str
    generation_kwh: float


class PredictResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    city: str
    usable_area_m2: float
    capacity_kwp: float
    annual_generation_kwh: float
    monthly_generation: list[MonthlyGeneration]
    install_cost_inr: float
    annual_savings_inr: float
    savings_5yr_inr: float
    savings_10yr_inr: float
    payback_period_years: float
    model_source: str = Field(
        ..., description="Whether the estimate came from the trained neural net or the physics-only fallback."
    )


class CityOut(BaseModel):
    key: str
    name: str
    latitude: float
    longitude: float
