"""
PyTorch regression model: predicts specific PV power output (W per kWp)
from hourly weather/irradiance features. Trained as a surrogate for the
PVWatts physical simulation (see pv_simulation.py) across both cities at
once, with latitude as an input feature so it isn't hard-coded to one site
-- the explicit path to "add a third city" the original project called out.
"""
import json
from pathlib import Path

import numpy as np
import torch
from torch import nn

INPUT_FEATURES = [
    "ghi", "dni", "dhi", "gti", "cloud_amt", "cloud_opacity",
    "temp_air", "wind_speed", "rel_humidity", "precip", "albedo", "pressure",
    "hour_sin", "hour_cos", "doy_sin", "doy_cos", "latitude",
]

MODELS_DIR = Path(__file__).resolve().parents[2] / "models"


class SolarOutputMLP(nn.Module):
    def __init__(self, n_inputs: int = len(INPUT_FEATURES)):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_inputs, 64),
            nn.ReLU(),
            nn.Linear(64, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
        )

    def forward(self, x):
        return self.net(x).squeeze(-1)


class FeatureScaler:
    """Minimal standardization scaler, serializable to JSON (avoids a
    sklearn/joblib version-pinning dependency for such a small array)."""

    def __init__(self, mean: np.ndarray, std: np.ndarray):
        self.mean = mean
        self.std = std

    def transform(self, x: np.ndarray) -> np.ndarray:
        return (x - self.mean) / self.std

    def to_json(self) -> dict:
        return {"mean": self.mean.tolist(), "std": self.std.tolist()}

    @classmethod
    def from_json(cls, payload: dict) -> "FeatureScaler":
        return cls(np.array(payload["mean"]), np.array(payload["std"]))


def save_artifacts(model: nn.Module, scaler: FeatureScaler, metrics: dict, name: str = "solar_mlp"):
    MODELS_DIR.mkdir(exist_ok=True)
    torch.save(model.state_dict(), MODELS_DIR / f"{name}.pt")
    with open(MODELS_DIR / f"{name}_scaler.json", "w") as f:
        json.dump(scaler.to_json(), f)
    with open(MODELS_DIR / f"{name}_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)


def load_artifacts(name: str = "solar_mlp") -> tuple[SolarOutputMLP, FeatureScaler] | None:
    model_path = MODELS_DIR / f"{name}.pt"
    scaler_path = MODELS_DIR / f"{name}_scaler.json"
    if not (model_path.exists() and scaler_path.exists()):
        return None
    model = SolarOutputMLP()
    model.load_state_dict(torch.load(model_path, map_location="cpu", weights_only=True))
    model.eval()
    with open(scaler_path) as f:
        scaler = FeatureScaler.from_json(json.load(f))
    return model, scaler


def predict_specific_power(model: SolarOutputMLP, scaler: FeatureScaler, features: np.ndarray) -> np.ndarray:
    """features: (N, len(INPUT_FEATURES)) array, in INPUT_FEATURES order."""
    x = scaler.transform(features)
    with torch.no_grad():
        out = model(torch.tensor(x, dtype=torch.float32))
    return out.numpy().clip(min=0)
