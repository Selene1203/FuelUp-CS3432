"use client";

import Link from "next/link";
import { MapPin, Clock, BadgeCheck, Fuel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./star-rating";
import type { Station, StationFuel } from "@/lib/api";

interface StationCardProps {
  station: Station & { fuels?: StationFuel[] };
  showRemoveButton?: boolean;
  onRemove?: () => void;
}

export function StationCard({
  station,
  showRemoveButton,
  onRemove,
}: StationCardProps) {
  return (
    <Card className="overflow-hidden hover:border-[#FF6B00]/50 transition-colors">
      <Link href={`/stations/${station.station_id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">
                  {station.name}
                </h3>
                {station.is_verified && (
                  <BadgeCheck className="h-4 w-4 text-[#FF6B00] flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {station.city}, {station.country}
                </span>
              </div>
            </div>
            {station.avg_rating !== undefined && station.avg_rating > 0 && (
              <div className="flex items-center gap-1">
                <StarRating rating={Math.round(station.avg_rating)} size="sm" />
                <span className="text-sm text-muted-foreground">
                  {station.avg_rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {station.opening_hours && (
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{station.opening_hours}</span>
            </div>
          )}

          {station.fuels && station.fuels.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Fuel className="h-4 w-4 text-muted-foreground" />
              {station.fuels.slice(0, 4).map((fuel) => (
                <Badge
                  key={fuel.fuel_id || fuel.fuel_type_id}
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: fuel.color_hex,
                    color: fuel.color_hex,
                  }}
                >
                  {fuel.fuel_name}
                </Badge>
              ))}
              {station.fuels.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{station.fuels.length - 4}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Link>
      {showRemoveButton && onRemove && (
        <div className="px-4 pb-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
            className="text-sm text-destructive hover:underline"
          >
            Remove from favourites
          </button>
        </div>
      )}
    </Card>
  );
}
