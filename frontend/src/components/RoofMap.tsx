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
  return turf.area(poly) // m^2
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area])

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

  // Create GeoJSON for the polygon
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

  // Create GeoJSON for the points
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ position: 'relative', overflow: 'hidden', border: '3px solid #fbbf24', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)' }}>
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt: any) => setViewState(evt.viewState)}
          style={{ height: '420px', width: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          onClick={handleMapClick}
          scrollZoom
        >
          <NavigationControl position="top-left" />
          <GeolocateControl position="top-left" />

          {/* Polygon fill */}
          {points.length >= 3 && (
            <Source id="polygon-source" type="geojson" data={polygonGeoJSON}>
              <Layer
                id="polygon-fill"
                type="fill"
                paint={{
                  'fill-color': '#fbbf24',
                  'fill-opacity': 0.2,
                }}
              />
              <Layer
                id="polygon-stroke"
                type="line"
                paint={{
                  'line-color': '#fbbf24',
                  'line-width': 3,
                }}
              />
            </Source>
          )}

          {/* Points */}
          {points.length > 0 && (
            <Source id="points-source" type="geojson" data={pointsGeoJSON}>
              <Layer
                id="points-layer"
                type="circle"
                paint={{
                  'circle-radius': 6,
                  'circle-color': '#fbbf24',
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#fff',
                }}
              />
            </Source>
          )}
        </Map>

        <div style={{ pointerEvents: 'none', position: 'absolute', left: '12px', top: '12px', background: 'rgba(255, 251, 240, 0.9)', padding: '8px 12px', fontSize: '12px', color: '#6b7280', backdropFilter: 'blur(4px)' }}>
          Click to trace your rooftop outline · {points.length} point{points.length === 1 ? '' : 's'}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '14px', color: '#1f2937' }}>
          Traced area:{' '}
          <span style={{ fontWeight: 700, color: '#f59e0b' }}>{area.toFixed(1)} m²</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={undo}
            disabled={points.length === 0}
            style={{ padding: '8px 14px', border: '2px solid #fbbf24', background: 'white', color: '#1f2937', fontSize: '13px', fontFamily: 'Poppins, system-ui, sans-serif', cursor: points.length === 0 ? 'not-allowed' : 'pointer', opacity: points.length === 0 ? 0.4 : 1, transition: 'all 0.2s' }}
            onMouseEnter={(e) => points.length > 0 && (e.currentTarget.style.background = '#fef3c7')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
          >
            ↶ Undo point
          </button>
          <button
            onClick={clear}
            disabled={points.length === 0}
            style={{ padding: '8px 14px', border: '2px solid #fbbf24', background: 'white', color: '#1f2937', fontSize: '13px', fontFamily: 'Poppins, system-ui, sans-serif', cursor: points.length === 0 ? 'not-allowed' : 'pointer', opacity: points.length === 0 ? 0.4 : 1, transition: 'all 0.2s' }}
            onMouseEnter={(e) => points.length > 0 && (e.currentTarget.style.background = '#fef3c7')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
          >
            ✕ Clear
          </button>
        </div>
      </div>
    </div>
  )
}