import { useEffect, useState } from 'react'
import RoofMap from './components/RoofMap'
import ResultsDashboard from './components/ResultsDashboard'
import { fetchCities, predict, type City, type PredictResponse } from './api'

type LatLngTuple = [number, number]

const FALLBACK_CITIES: City[] = [
  { key: 'bangalore', name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
  { key: 'mumbai', name: 'Mumbai', latitude: 19.076, longitude: 72.8777 },
]

export default function App() {
  const [cities, setCities] = useState<City[]>(FALLBACK_CITIES)
  const [cityKey, setCityKey] = useState('bangalore')
  const [areaM2, setAreaM2] = useState(0)
  const [tiltOverride, setTiltOverride] = useState<string>('')
  const [azimuth, setAzimuth] = useState(180)
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiOnline, setApiOnline] = useState(true)

  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch(() => setApiOnline(false))
  }, [])

  const city = cities.find((c) => c.key === cityKey) ?? cities[0]
  const center: LatLngTuple = [city.latitude, city.longitude]

  const handlePredict = async () => {
    if (areaM2 < 1) {
      setError('Trace your rooftop outline on the map first (at least 3 points).')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await predict({
        city: cityKey,
        roof_area_m2: areaM2,
        tilt_deg: tiltOverride ? Number(tiltOverride) : undefined,
        azimuth_deg: azimuth,
      })
      setResult(res)
    } catch {
      setError('Prediction failed. Is the backend running?')
      setApiOnline(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              ☀ Rooftop Solar Power Predictor
            </h1>
            <p className="text-xs text-slate-400">
              Trace your roof, estimate generation, cost, and payback
            </p>
          </div>
          {!apiOnline && (
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-300">
              Backend unreachable
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-5">
        <section className="flex flex-col gap-4 lg:col-span-3">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">City</span>
              <select
                value={cityKey}
                onChange={(e) => setCityKey(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              >
                {cities.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Panel tilt (° &mdash; blank = optimal)</span>
              <input
                type="number"
                placeholder="auto"
                value={tiltOverride}
                onChange={(e) => setTiltOverride(e.target.value)}
                className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Azimuth (° &mdash; 180 = south)</span>
              <input
                type="number"
                value={azimuth}
                onChange={(e) => setAzimuth(Number(e.target.value))}
                className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </label>
          </div>

          <RoofMap center={center} onAreaChange={(a) => setAreaM2(a)} />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-fit rounded-lg bg-cyan-500 px-5 py-2.5 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? 'Predicting…' : 'Predict generation & savings'}
          </button>
        </section>

        <section className="lg:col-span-2">
          {result ? (
            <ResultsDashboard result={result} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-700/60 p-8 text-center text-sm text-slate-500">
              Trace your rooftop and hit predict to see generation, cost, and payback estimates.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
