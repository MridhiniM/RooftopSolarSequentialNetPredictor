import { useMemo, useState, useEffect, useRef } from 'react'
import Map, { GeolocateControl, NavigationControl, Source, Layer } from 'react-map-gl/mapbox'
import * as turf from '@turf/turf'
import type { MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

type LatLngTuple = [number, number]

interface RoofMapProps {
  center: LatLngTuple
  onAreaChange: (areaM2: number, points: LatLngTuple[]) => void
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

function polygonAreaM2(points: LatLngTuple[]): number {
  if (points.length < 3) return 0
  const ring = [...points.map(([lat, lng]) => [lng, lat]), [points[0][1], points[0][0]]]
  const poly = turf.polygon([ring])
  return turf.area(poly)
}

export default function RoofMap({ center, onAreaChange }: RoofMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [points, setPoints] = useState<LatLngTuple[]>([])
  const [viewState, setViewState] = useState({
    longitude: center[1],
    latitude: center[0],
    zoom: 19,
  })

  const area = useMemo(() => polygonAreaM2(points), [points])

  useEffect(() => {
    onAreaChange(area, points)
  }, [area, onAreaChange])

  useEffect(() => {
    setViewState({
      longitude: center[1],
      latitude: center[0],
      zoom: 19,
    })
  }, [center[0], center[1]])

  const handleMapClick = (event: any) => {
    const { lng, lat } = event.lngLat
    setPoints((prev) => [...prev, [lat, lng]])
  }

  const undo = () => setPoints((prev) => prev.slice(0, -1))
  const clear = () => setPoints([])

  const polygonGeoJSON = {
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [
        [...points.map(([lat, lng]) => [lng, lat]), [points[0][1], points[0][0]]],
      ],
    },
    properties: {},
  }

  const pointsGeoJSON = {
    type: 'FeatureCollection' as const,
    features: points.map(([lat, lng]) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [lng, lat],
      },
      properties: {},
    })),
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 shadow-lg shadow-black/30">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt:any) => setViewState(evt.viewState)}
          style={{ height: '420px', width: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          onClick={handleMapClick}
          scrollZoom
        >
          <NavigationControl position="top-left" />
          <GeolocateControl position="top-left" />

          {points.length >= 3 && (
            <Source id="polygon-source" type="geojson" data={polygonGeoJSON}>
              <Layer
                id="polygon-fill"
                type="fill"
                paint={{
                  'fill-color': '#22d3ee',
                  'fill-opacity': 0.25,
                }}
              />
              <Layer
                id="polygon-stroke"
                type="line"
                paint={{
                  'line-color': '#22d3ee',
                  'line-width': 2,
                }}
              />
            </Source>
          )}

          {points.length > 0 && (
            <Source id="points-source" type="geojson" data={pointsGeoJSON}>
              <Layer
                id="points-layer"
                type="circle"
                paint={{
                  'circle-radius': 6,
                  'circle-color': '#facc15',
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#fff',
                }}
              />
            </Source>
          )}
        </Map>

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