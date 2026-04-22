"use client";

import { useState, useEffect, memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { Navigation } from "lucide-react";
import type { Station } from "@/lib/api";

// Free TopoJSON - no API key needed
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface StationMapProps {
  stations: Station[];
  onStationClick?: (station: Station) => void;
  showUserLocation?: boolean;
}

function StationMapComponent({ stations, onStationClick, showUserLocation = true }: StationMapProps) {
  const [tooltipContent, setTooltipContent] = useState<string>("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Ensure stations is always an array
  const safeStations = Array.isArray(stations) ? stations : [];

  // Attempt to get user's GPS location
  useEffect(() => {
    if (!showUserLocation) return;
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    setIsLoadingLocation(true);
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError("");
        setIsLoadingLocation(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out");
            break;
          default:
            setLocationError("Unknown location error");
        }
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [showUserLocation]);

  // Calculate center based on user location or stations, default to Southern Africa
  const getMapCenter = (): [number, number] => {
    // If user location is available, center on user
    if (userLocation) {
      return [userLocation.longitude, userLocation.latitude];
    }
    
    if (safeStations.length === 0) return [25, -29]; // Default: Southern Africa
    
    const lats = safeStations.filter(s => s.latitude).map(s => parseFloat(String(s.latitude)));
    const lngs = safeStations.filter(s => s.longitude).map(s => parseFloat(String(s.longitude)));
    
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

          {/* User location marker */}
          {userLocation && (
            <Marker coordinates={[userLocation.longitude, userLocation.latitude]}>
              <g>
                <circle
                  r={10}
                  fill="rgba(59, 130, 246, 0.3)"
                  className="animate-ping"
                />
                <circle
                  r={8}
                  fill="#3B82F6"
                  stroke="#fff"
                  strokeWidth={2}
                />
                <circle
                  r={3}
                  fill="#fff"
                />
              </g>
            </Marker>
          )}

          {/* Station markers */}
          {safeStations
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

      {/* GPS Status indicator */}
      {showUserLocation && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 text-xs">
          <Navigation className={`h-3 w-3 ${userLocation ? 'text-blue-500' : 'text-muted-foreground'}`} />
          {isLoadingLocation ? (
            <span className="text-muted-foreground">Getting location...</span>
          ) : userLocation ? (
            <span className="text-blue-500">GPS Active</span>
          ) : locationError ? (
            <span className="text-muted-foreground">{locationError}</span>
          ) : (
            <span className="text-muted-foreground">GPS Off</span>
          )}
        </div>
      )}

      {safeStations.length === 0 && !userLocation && (
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
