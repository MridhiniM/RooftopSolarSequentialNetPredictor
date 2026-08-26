import { useMemo, useState, useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, CircleMarker, useMapEvents, useMap } from 'react-leaflet'
import * as turf from '@turf/turf'
import type { LatLngExpression, LatLngTuple } from 'leaflet'

interface RoofMapProps {
  center: LatLngTuple
  onAreaChange: (areaM2: number, points: LatLngTuple[]) => void
}

function ClickCapture({ onClick }: { onClick: (latlng: LatLngTuple) => void }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

function Recenter({ center }: { center: LatLngTuple }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]])
  return null
}

function polygonAreaM2(points: LatLngTuple[]): number {
  if (points.length < 3) return 0
  const ring = [...points.map(([lat, lng]) => [lng, lat]), [points[0][1], points[0][0]]]
  const poly = turf.polygon([ring])
  return turf.area(poly) // m^2
}

export default function RoofMap({ center, onAreaChange }: RoofMapProps) {
  const [points, setPoints] = useState<LatLngTuple[]>([])

  const area = useMemo(() => polygonAreaM2(points), [points])

  useEffect(() => {
    onAreaChange(area, points)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area])

  const addPoint = (pt: LatLngTuple) => setPoints((prev) => [...prev, pt])
  const undo = () => setPoints((prev) => prev.slice(0, -1))
  const clear = () => setPoints([])

  const polygonPositions = points as LatLngExpression[]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 shadow-lg shadow-black/30">
        <MapContainer
          center={center}
          zoom={19}
          scrollWheelZoom
          style={{ height: '420px', width: '100%' }}
        >
          <TileLayer
            attribution="Tiles &copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={20}
          />
          <ClickCapture onClick={addPoint} />
          <Recenter center={center} />
          {points.map((p, i) => (
            <CircleMarker
              key={i}
              center={p}
              radius={5}
              pathOptions={{ color: '#facc15', fillColor: '#facc15', fillOpacity: 1 }}
            />
          ))}
          {points.length >= 3 && (
            <Polygon
              positions={polygonPositions}
              pathOptions={{ color: '#22d3ee', weight: 2, fillColor: '#22d3ee', fillOpacity: 0.25 }}
            />
          )}
        </MapContainer>
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs text-slate-200 backdrop-blur">
          Click to trace your rooftop outline &middot; {points.length} point{points.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-300">
          Traced area:{' '}
          <span className="font-semibold text-cyan-300">{area.toFixed(1)} m&sup2;</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={points.length === 0}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800 disabled:opacity-40"
          >
            Undo point
          </button>
          <button
            onClick={clear}
            disabled={points.length === 0}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800 disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
