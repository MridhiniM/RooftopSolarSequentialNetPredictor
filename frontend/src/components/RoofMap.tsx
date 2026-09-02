import React, { useState, useEffect } from 'react';
import Map, { NavigationControl, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface RoofMapProps {
  center?: [number, number];       // [lat, lng] from original Leaflet state
  coordinates?: [number, number];  // [lng, lat] from new Mapbox configuration
  onAreaChange: (area: number) => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const RoofMap: React.FC<RoofMapProps> = ({ center, coordinates, onAreaChange }) => {
  // Safely fallback to center if coordinates isn't provided, and swap array index order for Mapbox [lng, lat]
  const lng = coordinates ? coordinates[0] : (center ? center[1] : 77.5946);
  const lat = coordinates ? coordinates[1] : (center ? center[0] : 12.9716);

  const [viewState, setViewState] = useState({
    latitude: lat,
    longitude: lng,
    zoom: 15
  });

  // Track coordinate changes smoothly when dropdown selection shifts
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      longitude: lng,
      latitude: lat
    }));

    // Fires area setup to unlock your prediction calculation flows
    onAreaChange(120); 
  }, [lat, lng, onAreaChange]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="p-4 rounded-lg bg-red-950/50 border border-red-500/30 text-red-200 text-sm">
        <strong>Error:</strong> Mapbox token missing. Ensure <code>VITE_MAPBOX_TOKEN</code> is in your Vercel Environment Variables.
      </div>
    );
  }

  return (
    <div className="w-full h-[450px] rounded-xl overflow-hidden border border-slate-800 relative">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />
        
        <Marker 
          longitude={lng} 
          latitude={lat} 
          color="#06b6d4"
        />
      </Map>
      
      <div className="absolute bottom-2 left-2 bg-slate-950/80 border border-slate-800 backdrop-blur text-[11px] text-slate-300 px-2 py-1 rounded">
        📍 Mapbox Active (120 m² roof template applied)
      </div>
    </div>
  );
};

export default RoofMap;
