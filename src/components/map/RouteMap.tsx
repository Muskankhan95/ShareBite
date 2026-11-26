"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building,
  RefreshCw,
  Compass,
} from "lucide-react";
import {
  calculateHaversineDistance,
  calculateTravelTimeMinutes,
  generateRouteWaypoints,
} from "@/lib/utils/geo";

interface RouteMapProps {
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffAddress: string;
  dropoffLat?: number;
  dropoffLng?: number;
  donorName?: string;
  ngoName?: string;
  distanceKm?: number;
  estimatedDurationMins?: number;
  height?: string;
  vehicleType?: string;
}

export default function RouteMap({
  pickupAddress,
  pickupLat = 37.7915,
  pickupLng = -122.3999,
  dropoffAddress,
  dropoffLat = 37.7858,
  dropoffLng = -122.4042,
  donorName = "Donor Location",
  ngoName = "Receiving NGO",
  distanceKm: initialDistanceKm,
  estimatedDurationMins: initialDurationMins,
  height = "380px",
  vehicleType = "Bike",
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Geographic calculations
  const distanceKm =
    initialDistanceKm ??
    calculateHaversineDistance(pickupLat, pickupLng, dropoffLat, dropoffLng, "km");
  const distanceMiles = calculateHaversineDistance(
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    "miles"
  );
  const durationMins =
    initialDurationMins ?? calculateTravelTimeMinutes(distanceKm, vehicleType);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initRouteMap() {
      try {
        const L = (await import("leaflet")).default;

        if (!isMounted || !mapContainerRef.current) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: true,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // 1. Pickup Origin Marker (🟢 Green)
        const pickupIcon = L.divIcon({
          className: "route-origin-pin",
          html: `
            <div style="background-color: #10b981; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid #ffffff; cursor: pointer;">
              <span style="color: #ffffff; font-size: 16px;">📍</span>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
        });

        const pickupMarker = L.marker([pickupLat, pickupLng], { icon: pickupIcon }).addTo(map);
        pickupMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <strong style="color: #047857; text-transform: uppercase; font-size: 10px;">PICKUP LOCATION</strong>
            <h4 style="font-size: 13px; font-weight: bold; margin: 2px 0 4px 0;">${donorName}</h4>
            <p style="color: #475569; margin: 0; font-size: 11px;">${pickupAddress}</p>
          </div>
        `);

        // 2. NGO Destination Marker (🔵 Blue)
        const dropoffIcon = L.divIcon({
          className: "route-dest-pin",
          html: `
            <div style="background-color: #2563eb; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid #ffffff; cursor: pointer;">
              <span style="color: #ffffff; font-size: 16px;">🏁</span>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
        });

        const dropoffMarker = L.marker([dropoffLat, dropoffLng], { icon: dropoffIcon }).addTo(map);
        dropoffMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <strong style="color: #1d4ed8; text-transform: uppercase; font-size: 10px;">DESTINATION NGO</strong>
            <h4 style="font-size: 13px; font-weight: bold; margin: 2px 0 4px 0;">${ngoName}</h4>
            <p style="color: #475569; margin: 0; font-size: 11px;">${dropoffAddress}</p>
          </div>
        `);

        // 3. Draw Polyline Route
        const waypoints = generateRouteWaypoints(
          { latitude: pickupLat, longitude: pickupLng },
          { latitude: dropoffLat, longitude: dropoffLng }
        );

        const routeLine = L.polyline(waypoints, {
          color: "#059669",
          weight: 5,
          opacity: 0.85,
          lineJoin: "round",
          dashArray: "1, 10",
        }).addTo(map);

        // Also add a solid background line for contrast
        L.polyline(waypoints, {
          color: "#10b981",
          weight: 4,
          opacity: 0.6,
        }).addTo(map);

        // Fit Bounds to enclose both markers and entire route
        const bounds = L.latLngBounds([
          [pickupLat, pickupLng],
          [dropoffLat, dropoffLng],
        ]);
        map.fitBounds(bounds, { padding: [45, 45] });

        mapInstanceRef.current = map;
        setIsLoading(false);
      } catch (err: any) {
        if (isMounted) {
          setMapError("Failed to initialize route mapping. Details displayed in text summary.");
          setIsLoading(false);
        }
      }
    }

    initRouteMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng, donorName, ngoName]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      {/* Route Header Metrics Banner */}
      <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold tracking-wide uppercase">
            <Navigation className="w-3.5 h-3.5" />
            Active Pickup & Delivery Corridor
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white mt-1">
            {donorName} <span className="text-slate-400 font-normal">→</span> {ngoName}
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total Distance</span>
            <span className="text-base font-extrabold text-white">
              {distanceKm} km <span className="text-xs text-slate-400 font-normal">({distanceMiles} mi)</span>
            </span>
          </div>

          <div className="h-8 w-px bg-slate-700 hidden sm:block" />

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Est. Transit Time</span>
            <span className="text-base font-extrabold text-emerald-400 flex items-center justify-end gap-1">
              <Clock className="w-4 h-4 inline" /> ~{durationMins} mins
            </span>
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="relative">
        <div ref={mapContainerRef} style={{ height, width: "100%" }} />

        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-700 text-xs font-semibold">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
              Plotting route waypoints...
            </div>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-8 h-8 text-amber-600 mb-1" />
            <p className="text-xs text-slate-700 font-medium">{mapError}</p>
          </div>
        )}
      </div>

      {/* Turn-by-Turn Leg Instructions */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          Waypoint Route Guidance
        </h4>

        <div className="space-y-3 text-xs">
          {/* Leg 1: Pickup */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
              1
            </div>
            <div>
              <p className="font-bold text-slate-900">
                Collect Food Donation at {donorName}
              </p>
              <p className="text-slate-500">{pickupAddress}</p>
            </div>
          </div>

          {/* Leg 2: Transit */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold">
              2
            </div>
            <div>
              <p className="font-bold text-slate-900">
                In-Transit Corridor ({distanceKm} km &bull; ~{durationMins} mins via {vehicleType})
              </p>
              <p className="text-slate-500">
                Maintain insulated bags and temperature precautions during handover.
              </p>
            </div>
          </div>

          {/* Leg 3: Delivery */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
              3
            </div>
            <div>
              <p className="font-bold text-slate-900">
                Arrive at Receiving Intake: {ngoName}
              </p>
              <p className="text-slate-500">{dropoffAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
