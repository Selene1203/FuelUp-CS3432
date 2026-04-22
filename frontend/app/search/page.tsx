"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Search as SearchIcon, Map, List, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";
import { StationCard } from "@/components/station-card";
import { PageLoading } from "@/components/loading-spinner";
import { Spinner } from "@/components/ui/spinner";
import { api, type FuelType, type Station, isAuthenticated } from "@/lib/api";

// Dynamically import the map to avoid SSR issues with react-simple-maps
const StationMap = dynamic(() => import("@/components/station-map").then(mod => ({ default: mod.StationMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-lg bg-card border border-border flex items-center justify-center">
      <Spinner className="h-6 w-6" />
    </div>
  ),
});

const COUNTRIES = ["Lesotho", "South Africa"];

export default function SearchPage() {
  const router = useRouter();
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [hasGpsPermission, setHasGpsPermission] = useState(false);
  const [showTrackingMap, setShowTrackingMap] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  
  // Check GPS availability and switch to map view if GPS is active
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setHasGpsPermission(true);
        }
        result.onchange = () => {
          setHasGpsPermission(result.state === 'granted');
        };
      }).catch(() => {
        // Permissions API not supported, try to get location anyway
      });
    }
  }, []);

  useEffect(() => {
    const fetchFuelTypes = async () => {
      try {
        const data = await api<{ fuels: FuelType[] }>("/api/fueltypes");
        if (data.fuels && Array.isArray(data.fuels)) {
          // Deduplicate by fuel_name
          const uniqueFuels = data.fuels.reduce((acc: FuelType[], fuel) => {
            if (!acc.find(f => f.fuel_name === fuel.fuel_name)) {
              acc.push(fuel);
            }
            return acc;
          }, []);
          setFuelTypes(uniqueFuels);
        }
      } catch (error) {
        toast.error("Failed to load fuel types");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFuelTypes();
  }, []);

  const handleSearch = useCallback(async () => {
    setSearching(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (fuelTypeFilter && fuelTypeFilter !== "all")
        params.append("fuel_type_id", fuelTypeFilter);
      if (countryFilter && countryFilter !== "all")
        params.append("country", countryFilter);

      const queryString = params.toString();
      const data = await api<{ count: number; stations: Station[] } | Station[]>(
        `/api/stations${queryString ? `?${queryString}` : ""}`
      );
      // API returns { count, stations } or plain array
      const stationsArray = Array.isArray(data) ? data : (data.stations || []);
      setStations(stationsArray);

      // Log search if user is authenticated
      if (isAuthenticated()) {
        try {
          await api("/api/users/searches", {
            method: "POST",
            requiresAuth: true,
            body: JSON.stringify({
              query_text: searchQuery.trim() || "",
              fuel_type_id:
                fuelTypeFilter && fuelTypeFilter !== "all"
                  ? parseInt(fuelTypeFilter)
                  : null,
              results_count: stationsArray.length,
            }),
          });
        } catch {
          // Silently fail - search logging is not critical
        }
      }
    } catch (error) {
      toast.error("Search failed");
      console.error(error);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, fuelTypeFilter, countryFilter]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <main className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-lg mx-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Find a Station</h1>
            <div className="flex items-center gap-1">
              {/* GPS Tracking Button - shows map with user location */}
              <Button
                variant={showTrackingMap ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowTrackingMap(!showTrackingMap)}
                className={showTrackingMap ? "bg-blue-500 hover:bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"}
                title="Track my location"
              >
                <Navigation className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                className="text-muted-foreground hover:text-foreground"
              >
                {viewMode === "list" ? (
                  <>
                    <Map className="h-4 w-4 mr-1" />
                    Map
                  </>
                ) : (
                  <>
                    <List className="h-4 w-4 mr-1" />
                    List
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search by name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
            >
              {searching ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <SearchIcon className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={fuelTypeFilter} onValueChange={setFuelTypeFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Fuel Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fuels</SelectItem>
                {Array.isArray(fuelTypes) && fuelTypes.map((fuel) => (
                  <SelectItem
                    key={fuel.fuel_id}
                    value={fuel.fuel_id.toString()}
                  >
                    <span style={{ color: fuel.color_hex }}>{fuel.fuel_name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {/* GPS Tracking Map - shows when user clicks the navigation button */}
        {showTrackingMap && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Navigation className="h-4 w-4 text-blue-500" />
                GPS Tracking
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTrackingMap(false)}
                className="text-xs text-muted-foreground"
              >
                Hide
              </Button>
            </div>
            <StationMap
              stations={Array.isArray(stations) ? stations : []}
              onStationClick={(station) => router.push(`/stations/${station.station_id}`)}
              showUserLocation={true}
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Your location is shown with a blue marker. Search for stations to see them on the map.
            </p>
          </div>
        )}
        
        {!hasSearched && !showTrackingMap ? (
          <div className="text-center py-12 text-muted-foreground">
            <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Search for fuel stations</p>
            <p className="text-sm">
              Enter a name, city, or use filters to find stations
            </p>
            {hasGpsPermission && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTrackingMap(true)}
                className="mt-4 border-blue-500 text-blue-500 hover:bg-blue-500/10"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Track My Location
              </Button>
            )}
          </div>
        ) : !hasSearched && showTrackingMap ? null : searching ? (
          <PageLoading />
        ) : stations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No stations found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {stations.length} station{stations.length !== 1 ? "s" : ""} found
            </p>
            
            {viewMode === "map" && Array.isArray(stations) ? (
              <StationMap
                stations={stations}
                onStationClick={(station) => router.push(`/stations/${station.station_id}`)}
              />
            ) : null}
            
            {Array.isArray(stations) && stations.map((station) => (
              <StationCard key={station.station_id} station={station} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
