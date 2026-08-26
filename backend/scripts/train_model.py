"""
End-to-end training run: load NASA POWER CSVs for every supported city,
engineer features, simulate the PVWatts ground-truth target, train the
PyTorch surrogate model, evaluate on a held-out final year per city, and
save model weights + a "typical year" hourly climatology per city (used by
the API for fast inference without needing live weather data).

    cd backend && python -m scripts.train_model
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

sys.path.append(str(Path(__file__).resolve().parents[1]))
from app.config import SUPPORTED_CITIES  # noqa: E402
from app.ml.data_prep import load_city_hourly  # noqa: E402
from app.ml.features import FEATURE_COLUMNS, engineer_features  # noqa: E402
from app.ml.model import INPUT_FEATURES, FeatureScaler, SolarOutputMLP, save_artifacts  # noqa: E402
from app.ml.pv_simulation import simulate_specific_power_w_per_kwp  # noqa: E402

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
TEST_YEAR = 2023  # held out entirely from training, for both cities


def build_dataset() -> pd.DataFrame:
    frames = []
    for city_key, city in SUPPORTED_CITIES.items():
        raw = load_city_hourly(city_key)
        feat = engineer_features(raw, latitude=city.latitude, longitude=city.longitude)
        feat["target_w_per_kwp"] = simulate_specific_power_w_per_kwp(feat)
        feat["latitude"] = city.latitude
        feat["city"] = city_key
        frames.append(feat)
    return pd.concat(frames)


def train():
    print("Loading + engineering features for all cities...")
    df = build_dataset()
    print(f"  total rows: {len(df):,}")

    train_df = df[df.index.year != TEST_YEAR]
    test_df = df[df.index.year == TEST_YEAR]
    print(f"  train rows: {len(train_df):,}  test rows (held-out {TEST_YEAR}): {len(test_df):,}")

    X_train = train_df[INPUT_FEATURES].to_numpy(dtype=np.float64)
    y_train = train_df["target_w_per_kwp"].to_numpy(dtype=np.float64)
    X_test = test_df[INPUT_FEATURES].to_numpy(dtype=np.float64)
    y_test = test_df["target_w_per_kwp"].to_numpy(dtype=np.float64)

    mean, std = X_train.mean(axis=0), X_train.std(axis=0)
    std[std == 0] = 1.0
    scaler = FeatureScaler(mean, std)

    X_train_s = scaler.transform(X_train)
    X_test_s = scaler.transform(X_test)

    train_ds = TensorDataset(
        torch.tensor(X_train_s, dtype=torch.float32), torch.tensor(y_train, dtype=torch.float32)
    )
    train_loader = DataLoader(train_ds, batch_size=256, shuffle=True)

    model = SolarOutputMLP()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = nn.MSELoss()

    epochs = 25
    print(f"Training for {epochs} epochs...")
    for epoch in range(epochs):
        model.train()
        total_loss = 0.0
        for xb, yb in train_loader:
            optimizer.zero_grad()
            pred = model(xb)
            loss = loss_fn(pred, yb)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * len(xb)
        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(f"  epoch {epoch + 1:2d}/{epochs}  train MSE: {total_loss / len(train_ds):.2f}")

    model.eval()
    with torch.no_grad():
        y_pred = model(torch.tensor(X_test_s, dtype=torch.float32)).numpy().clip(min=0)

    metrics = {
        "test_year": TEST_YEAR,
        "r2": round(float(r2_score(y_test, y_pred)), 4),
        "rmse_w_per_kwp": round(float(root_mean_squared_error(y_test, y_pred)), 2),
        "mae_w_per_kwp": round(float(mean_absolute_error(y_test, y_pred)), 2),
        "n_train": len(train_ds),
        "n_test": len(y_test),
        "features": INPUT_FEATURES,
    }
    print("Held-out test metrics:", metrics)

    save_artifacts(model, scaler, metrics)
    print("Saved model + scaler + metrics to backend/models/")

    build_climatology(df)


def build_climatology(df: pd.DataFrame):
    """Precompute two things per city, purely derived from the real 5-year
    dataset:
      1. A month x hour-of-day "typical profile" of raw weather features
         (typical_profile_<city>.json) -- the API runs the actual trained
         model against this at request time, so predictions come from live
         inference, not a canned number.
      2. A monthly climatology summary (climatology_<city>.json) used as a
         fast fallback / cross-check if model artifacts are ever missing.
    """
    import json

    for city_key in SUPPORTED_CITIES:
        city_df = df[df["city"] == city_key]
        n_years = len(city_df.index.year.unique())

        # 1. month x hour typical feature profile (288 representative points)
        month_key = pd.Series(city_df.index.month, index=city_df.index, name="month")
        hour_key = pd.Series(city_df.index.hour, index=city_df.index, name="hour")
        grouped = city_df.groupby([month_key, hour_key])
        profile = grouped[FEATURE_COLUMNS].mean().reset_index()
        with open(DATA_DIR / f"typical_profile_{city_key}.json", "w") as f:
            json.dump(profile.to_dict(orient="records"), f)
        print(f"  wrote typical_profile_{city_key}.json ({len(profile)} rows)")

        # 2. monthly climatology summary (fallback / sanity-check table)
        monthly_avg_w_per_kwp = city_df.groupby(city_df.index.month)["target_w_per_kwp"].mean()
        hours_per_month = city_df.groupby(city_df.index.month).size() / n_years
        monthly_gti = city_df.groupby(city_df.index.month)["gti"].sum() / n_years / 1000

        payload = {
            "monthly_gti_kwh_m2": monthly_gti.tolist(),
            "monthly_specific_yield_kwh_per_kwp": (
                monthly_avg_w_per_kwp * hours_per_month / 1000
            ).tolist(),
        }
        with open(DATA_DIR / f"climatology_{city_key}.json", "w") as f:
            json.dump(payload, f, indent=2)
        print(f"  wrote climatology_{city_key}.json")


if __name__ == "__main__":
    train()
