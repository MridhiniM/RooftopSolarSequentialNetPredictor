"""
TEMPORARY placeholder monthly irradiation figures, used only until the real
NASA-POWER-derived climatology (backend/data/climatology_<city>.json) has
been computed from actual historical data.

These numbers are rough, general solar-resource-atlas-level approximations
of average daily GHI (kWh/m^2/day) for each city/month -- good enough to
exercise the full API/frontend pipeline end-to-end, but NOT the authoritative
dataset. They must be replaced before this project is presented as final;
see backend/data/README.md for how the real dataset gets built.
"""

MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

# Approximate average daily GHI, kWh/m^2/day, per month (placeholder only).
SEED_MONTHLY_GHI_KWH_M2_DAY = {
    "bangalore": [5.6, 6.1, 6.5, 6.3, 5.9, 4.7, 4.3, 4.4, 4.8, 5.0, 5.1, 5.3],
    "mumbai":    [5.4, 6.0, 6.4, 6.5, 6.2, 4.2, 3.5, 3.7, 4.3, 5.2, 5.4, 5.3],
}

DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def seed_monthly_gti_kwh_m2(city_key: str, tilt_gain_factor: float = 1.08) -> list[float]:
    """Very rough monthly tilted-irradiation totals (kWh/m^2), derived by
    applying a flat tilt-gain factor to the seed GHI. Real GTI should come
    from app.ml.transposition once actual hourly data is available."""
    daily_ghi = SEED_MONTHLY_GHI_KWH_M2_DAY[city_key]
    return [
        ghi * days * tilt_gain_factor
        for ghi, days in zip(daily_ghi, DAYS_IN_MONTH)
    ]
