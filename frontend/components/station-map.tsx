"use client";

import { useState, memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import type { Station } from "@/lib/api";

// Free TopoJSON - no API key needed
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface StationMapProps {
  stations: Station[];
  onStationClick?: (station: Station) => void;
}

function StationMapComponent({ stations, onStationClick }: StationMapProps) {
  const [tooltipContent, setTooltipContent] = useState<string>("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Calculate center based on stations, default to Southern Africa
  const getMapCenter = (): [number, number] => {
    if (stations.length === 0) return [25, -29]; // Default: Southern Africa
    
    const lats = stations.filter(s => s.latitude).map(s => parseFloat(String(s.latitude)));
    const lngs = stations.filter(s => s.longitude).map(s => parseFloat(String(s.longitude)));
    
    if (lats.length === 0 || lngs.length === 0) return [25, -29];
    
    const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    
    return [avgLng, avgLat];
  };

  const center = getMapCenter();

  return (
    <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-card border border-border">
      {tooltipContent && (
        <div
          className="absolute z-50 px-2 py-1 text-xs bg-popover text-popover-foreground rounded shadow-lg pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltipContent}
        </div>
      )}
      
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 400,
          center: center,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup center={center} zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#2A2A2A"
                  stroke="#3A3A3A"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#3A3A3A", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {stations
            .filter((station) => station.latitude && station.longitude)
            .map((station) => {
              const lat = parseFloat(String(station.latitude));
              const lng = parseFloat(String(station.longitude));
              
              if (isNaN(lat) || isNaN(lng)) return null;

              return (
                <Marker
                  key={station.station_id}
                  coordinates={[lng, lat]}
                  onMouseEnter={(e) => {
                    setTooltipContent(station.name);
                    const rect = (e.target as SVGElement).getBoundingClientRect();
                    const container = (e.target as SVGElement).closest('.relative');
                    if (container) {
                      const containerRect = container.getBoundingClientRect();
                      setTooltipPosition({
                        x: rect.left - containerRect.left + rect.width / 2,
                        y: rect.top - containerRect.top - 5,
                      });
                    }
                  }}
                  onMouseLeave={() => setTooltipContent("")}
                  onClick={() => onStationClick?.(station)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    r={6}
                    fill="#FF6B00"
                    stroke="#fff"
                    strokeWidth={2}
                    className="transition-transform hover:scale-150"
                  />
                </Marker>
              );
            })}
        </ZoomableGroup>
      </ComposableMap>

      {stations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <p className="text-muted-foreground text-sm">
            Search for stations to see them on the map
          </p>
        </div>
      )}
    </div>
  );
}

export const StationMap = memo(StationMapComponent);
