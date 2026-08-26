import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8123'

export interface City {
  key: string
  name: string
  latitude: number
  longitude: number
}

export interface MonthlyGeneration {
  month: string
  generation_kwh: number
}

export interface PredictResponse {
  city: string
  usable_area_m2: number
  capacity_kwp: number
  annual_generation_kwh: number
  monthly_generation: MonthlyGeneration[]
  install_cost_inr: number
  annual_savings_inr: number
  savings_5yr_inr: number
  savings_10yr_inr: number
  payback_period_years: number
  model_source: string
}

export interface PredictRequest {
  city: string
  roof_area_m2: number
  tilt_deg?: number
  azimuth_deg?: number
}

const client = axios.create({ baseURL: API_BASE_URL })

export async function fetchCities(): Promise<City[]> {
  const { data } = await client.get<City[]>('/cities')
  return data
}

export async function predict(req: PredictRequest): Promise<PredictResponse> {
  const { data } = await client.post<PredictResponse>('/predict', req)
  return data
}
