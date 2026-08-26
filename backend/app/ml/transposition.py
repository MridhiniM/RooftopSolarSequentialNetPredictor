"""
Derive Global Tilted Irradiance (GTI) from horizontal-plane measurements.

NASA POWER (and most free irradiance sources) report GHI/DNI/DHI on a
horizontal plane, not on the panel's actual tilted plane. GTI has to be
computed with a sky-diffuse transposition model given the panel's tilt and
azimuth and the sun's position at each timestamp -- this is standard PV
engineering practice (see pvlib docs), and is more defensible than treating
GTI as if it were a raw measured field.
"""
import pandas as pd
import pvlib


def add_gti_column(
    df: pd.DataFrame,
    latitude: float,
    longitude: float,
    tilt_deg: float,
    azimuth_deg: float,
    ghi_col: str = "ghi",
    dni_col: str = "dni",
    dhi_col: str = "dhi",
    model: str = "haydavies",
) -> pd.DataFrame:
    """Add a `gti` column (W/m^2) to an hourly-indexed dataframe.

    `df.index` must be a tz-aware or UTC DatetimeIndex.
    """
    solar_position = pvlib.solarposition.get_solarposition(
        time=df.index, latitude=latitude, longitude=longitude
    )
    dni_extra = pvlib.irradiance.get_extra_radiation(df.index)

    total_irrad = pvlib.irradiance.get_total_irradiance(
        surface_tilt=tilt_deg,
        surface_azimuth=azimuth_deg,
        solar_zenith=solar_position["apparent_zenith"],
        solar_azimuth=solar_position["azimuth"],
        dni=df[dni_col],
        ghi=df[ghi_col],
        dhi=df[dhi_col],
        dni_extra=dni_extra,
        model=model,
    )
    out = df.copy()
    out["gti"] = total_irrad["poa_global"].clip(lower=0)
    return out


def optimal_tilt_for_latitude(latitude_deg: float) -> float:
    """Rule-of-thumb optimal fixed tilt: roughly equal to the site latitude."""
    return abs(latitude_deg)
