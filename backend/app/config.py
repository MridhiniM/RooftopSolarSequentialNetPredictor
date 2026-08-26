"""
Central configuration: supported cities, panel specs, and cost/tariff assumptions.

Cost and tariff figures are approximate 2026 Indian residential rooftop-solar
market rates, intended for an illustrative estimate rather than a bankable
quote. Keep this file as the single place to update assumptions so the README
and the API stay in sync.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class CityInfo:
    name: str
    latitude: float
    longitude: float
    timezone: str
    # Approx. residential grid tariff, INR per kWh (state avg domestic slab rate)
    electricity_tariff_inr_per_kwh: float


SUPPORTED_CITIES: dict[str, CityInfo] = {
    "bangalore": CityInfo(
        name="Bangalore",
        latitude=12.9716,
        longitude=77.5946,
        timezone="Asia/Kolkata",
        electricity_tariff_inr_per_kwh=7.25,
    ),
    "mumbai": CityInfo(
        name="Mumbai",
        latitude=19.0760,
        longitude=72.8777,
        timezone="Asia/Kolkata",
        electricity_tariff_inr_per_kwh=9.50,
    ),
}

# --- Panel / system assumptions -------------------------------------------------

PANEL_RATED_POWER_W = 400.0          # Standard mono-PERC residential panel
PANEL_EFFICIENCY = 0.205             # 20.5% module efficiency
PANEL_AREA_M2 = PANEL_RATED_POWER_W / (1000 * PANEL_EFFICIENCY)  # ~1.95 m^2 per panel
PERFORMANCE_RATIO = 0.80             # System losses: inverter, wiring, soiling, mismatch
DEFAULT_TILT_DEG = None              # None -> default to latitude angle (optimal, south-facing)
DEFAULT_AZIMUTH_DEG = 180.0          # True south (northern hemisphere optimum)
PACKING_FACTOR = 0.85                # Fraction of drawn rooftop polygon usable after
                                      # walkways/shading/setback losses

# --- Cost assumptions (INR) ------------------------------------------------------

INSTALL_COST_INR_PER_KWP = 50000.0   # Blended residential rooftop installed cost, pre-subsidy
DEGRADATION_NOTE = (
    "Panel degradation over time is ignored, consistent with the original "
    "project's scope."
)
