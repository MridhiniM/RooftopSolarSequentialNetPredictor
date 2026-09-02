import React, { useState, useEffect } from 'react';
import Map, { NavigationControl, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface RoofMapProps {
  coordinates: [number, number]; // [lng, lat]
  onAreaChange: (area: number) => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const RoofMap: React.FC<RoofMapProps> = ({ coordinates, onAreaChange }) => {
  const [viewState, setViewState] = useState({
    latitude: coordinates[1],
    longitude: coordinates[0],
    zoom: 13
  });

  // Keep map in sync when city select dropdown changes
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      longitude: coordinates[0],
      latitude: coordinates[1]
    }));
  }, [coordinates]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="p-4 rounded-lg bg-red-950/50 border border-red-500/30 text-red-200 text-sm">
        <strong>Error:</strong> Mapbox token missing. Add <code>VITE_MAPBOX_TOKEN</code> to your environment.
      </div>
    );
  }

  return (
    <div className="w-full h-[450px] rounded-xl overflow-hidden border border-slate-800 relative">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12" // Satellite view is better for tracing roofs!
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />
        
        <Marker 
          longitude={coordinates[0]} 
          latitude={coordinates[1]} 
          color="#06b6d4"
        />
      </Map>
      
      {/* Temporary placeholder notice until mapbox-gl-draw controls are implemented */}
      <div className="absolute bottom-2 left-2 bg-slate-950/80 border border-slate-800 backdrop-blur text-[11px] text-slate-400 px-2 py-1 rounded">
        Click to trace roof outline coming soon
      </div>
    </div>
  );
};

export default RoofMap;
