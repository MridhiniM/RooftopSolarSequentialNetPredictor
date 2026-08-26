"""
Physically-simulated "ground truth" PV output used to train the neural net.

There is no real installed-system telemetry available for this project (the
honest, known limitation of a student rebuild -- see the README's notes on
why this isn't research-paper-grade validation). Instead of pretending
otherwise, the training target here is a well-established physical
simulation: NREL's PVWatts DC model (via pvlib) driven by the derived GTI
and a NOCT-based cell-temperature model, with PVWatts' standard system-loss
breakdown applied. The neural net is trained to reproduce this physical
simulation's output from the raw weather features -- i.e. it's a learned
*surrogate* for a trusted physical model, not a fit to fabricated numbers.
"""
import pandas as pd
import pvlib

NOCT_C = 45.0  # Nominal Operating Cell Temperature, typical crystalline-Si panel
GAMMA_PDC = -0.0037  # %/degC power temperature coefficient, typical mono-PERC
PDC0_REFERENCE_W = 1000.0  # 1 "reference kWp" -- output is specific yield, W per kWp


def cell_temperature_c(temp_air_c: pd.Series, poa_global: pd.Series) -> pd.Series:
    """Simple NOCT-based cell temperature model."""
    return temp_air_c + (NOCT_C - 20.0) / 800.0 * poa_global


def simulate_specific_power_w_per_kwp(df: pd.DataFrame) -> pd.Series:
    """AC-equivalent specific power output (W per kWp installed) for every
    hour, using PVWatts DC model + PVWatts' standard loss breakdown."""
    t_cell = cell_temperature_c(df["temp_air"], df["gti"])
    dc_power = pvlib.pvsystem.pvwatts_dc(
        g_poa_effective=df["gti"],
        temp_cell=t_cell,
        pdc0=PDC0_REFERENCE_W,
        gamma_pdc=GAMMA_PDC,
    )
    system_losses_frac = pvlib.pvsystem.pvwatts_losses() / 100.0  # PVWatts default ~14%
    ac_power = dc_power * (1 - system_losses_frac)
    return ac_power.clip(lower=0)
