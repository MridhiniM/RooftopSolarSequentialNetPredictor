from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import predict

app = FastAPI(
    title="Rooftop Solar Power Predictor API",
    description=(
        "Predicts rooftop solar PV generation, installed cost, and bill "
        "savings for a user-drawn rooftop area, using historical irradiance "
        "data blended with a trained neural net and a physical PV model."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to the deployed frontend origin before shipping
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, tags=["predict"])


@app.get("/health")
def health():
    return {"status": "ok"}
