"""
Physics-grounded PV output and financial model.

This module is the "sanity anchor" for the neural net: even where training
data is sparse for a given month/city, the physical PV formula
    E (kWh) = A_usable (m^2) x panel_efficiency x H_tilted (kWh/m^2) x PR
still gives a defensible estimate. The trained model (see model.py) predicts
a correction/residual on top of this baseline rather than an unconstrained
absolute number, which keeps predictions physically sane.
"""
from dataclasses import dataclass

from app.config import (
    INSTALL_COST_INR_PER_KWP,
    PACKING_FACTOR,
    PANEL_EFFICIENCY,
    PERFORMANCE_RATIO,
)


def usable_roof_area_m2(drawn_polygon_area_m2: float) -> float:
    """Apply a packing factor to a raw drawn-polygon area to account for
    walkways, shading, vents, and setback losses that a real installer
    would subtract."""
    return max(drawn_polygon_area_m2, 0.0) * PACKING_FACTOR


def installed_capacity_kwp(usable_area_m2: float) -> float:
    """Peak DC capacity (kWp) the usable area can host, at STC (1000 W/m^2)."""
    return usable_area_m2 * PANEL_EFFICIENCY


def physical_energy_kwh(usable_area_m2: float, tilted_irradiation_kwh_per_m2: float) -> float:
    """Simplified standard PV yield formula: E = A x eff x H x PR."""
    return usable_area_m2 * PANEL_EFFICIENCY * tilted_irradiation_kwh_per_m2 * PERFORMANCE_RATIO


@dataclass
class FinancialSummary:
    capacity_kwp: float
    install_cost_inr: float
    annual_generation_kwh: float
    annual_savings_inr: float
    savings_5yr_inr: float
    savings_10yr_inr: float
    payback_period_years: float


def financial_summary(
    usable_area_m2: float,
    annual_generation_kwh: float,
    electricity_tariff_inr_per_kwh: float,
) -> FinancialSummary:
    capacity = installed_capacity_kwp(usable_area_m2)
    install_cost = capacity * INSTALL_COST_INR_PER_KWP
    annual_savings = annual_generation_kwh * electricity_tariff_inr_per_kwh
    payback = install_cost / annual_savings if annual_savings > 0 else float("inf")
    return FinancialSummary(
        capacity_kwp=round(capacity, 3),
        install_cost_inr=round(install_cost, 2),
        annual_generation_kwh=round(annual_generation_kwh, 2),
        annual_savings_inr=round(annual_savings, 2),
        savings_5yr_inr=round(annual_savings * 5, 2),
        savings_10yr_inr=round(annual_savings * 10, 2),
        payback_period_years=round(payback, 2),
    )
