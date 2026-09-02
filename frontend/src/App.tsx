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
    <div style={{ minHeight: '100vh', background: '#fffbf0', color: '#1f2937', display: 'flex' }}>
      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, borderBottom: '2px solid #fbbf24', background: '#fffbf0', backdropFilter: 'blur(4px)', zIndex: 40 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              ☀️ Rooftop Solar Predictor
            </h1>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Trace your roof, estimate generation, cost, and payback
            </p>
          </div>
          {!apiOnline && (
            <span style={{ background: '#fee2e2', padding: '8px 12px', borderRadius: 0, fontSize: '12px', color: '#dc2626' }}>
              Backend unreachable
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px', padding: '16px', maxWidth: '1400px', margin: '80px auto 0', width: '100%' }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280' }}>City</span>
              <select
                value={cityKey}
                onChange={(e) => setCityKey(e.target.value)}
                style={{ padding: '12px', border: '2px solid #fbbf24', background: 'white', color: '#1f2937', fontFamily: 'Poppins, system-ui, sans-serif', fontSize: '14px', cursor: 'pointer' }}
              >
                {cities.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280' }}>Panel tilt (° — blank = optimal)</span>
              <input
                type="number"
                placeholder="auto"
                value={tiltOverride}
                onChange={(e) => setTiltOverride(e.target.value)}
                style={{ width: '120px', padding: '12px', border: '2px solid #fbbf24', background: 'white', color: '#1f2937', fontFamily: 'Poppins, system-ui, sans-serif', fontSize: '14px' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280' }}>Azimuth (° — 180 = south)</span>
              <input
                type="number"
                value={azimuth}
                onChange={(e) => setAzimuth(Number(e.target.value))}
                style={{ width: '120px', padding: '12px', border: '2px solid #fbbf24', background: 'white', color: '#1f2937', fontFamily: 'Poppins, system-ui, sans-serif', fontSize: '14px' }}
              />
            </label>
          </div>

          <RoofMap center={center} onAreaChange={(a) => setAreaM2(a)} />

          {error && <p style={{ fontSize: '14px', color: '#dc2626', margin: 0 }}>{error}</p>}

          <button
            onClick={handlePredict}
            disabled={loading}
            style={{ width: 'fit-content', background: '#fbbf24', color: '#1f2937', padding: '14px 20px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'all 0.2s', fontFamily: 'Poppins, system-ui, sans-serif' }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#f59e0b')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fbbf24')}
          >
            {loading ? '⚡ Predicting…' : '⚡ PREDICT ENERGY OUTPUT'}
          </button>
        </section>

        <section style={{ background: 'white', border: '2px solid #fbbf24', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          {result ? (
            <ResultsDashboard result={result} />
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              Trace your rooftop and hit predict to see generation, cost, and payback estimates.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}