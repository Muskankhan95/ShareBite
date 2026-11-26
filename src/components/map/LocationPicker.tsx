"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Compass,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { approximateGeocode, DEFAULT_MAP_CENTER } from "@/lib/utils/geo";

interface LocationPickerProps {
  label?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  onLocationChange: (data: { address: string; latitude: number; longitude: number }) => void;
  isVolunteer?: boolean;
  required?: boolean;
}

export default function LocationPicker({
  label = "Location & Geographic Coordinates",
  address,
  latitude = 37.7749,
  longitude = -122.4194,
  onLocationChange,
  isVolunteer = false,
  required = false,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [currentLat, setCurrentLat] = useState<number>(latitude);
  const [currentLng, setCurrentLng] = useState<number>(longitude);
  const [inputAddress, setInputAddress] = useState<string>(address);

  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Sync internal state if props change externally
  useEffect(() => {
    if (latitude && longitude) {
      setCurrentLat(latitude);
      setCurrentLng(longitude);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    setInputAddress(address);
  }, [address]);

  // Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initPickerMap() {
      try {
        const L = (await import("leaflet")).default;

        if (!isMounted || !mapContainerRef.current) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [currentLat || DEFAULT_MAP_CENTER[0], currentLng || DEFAULT_MAP_CENTER[1]],
          zoom: 14,
          zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        const pinIcon = L.divIcon({
          className: "picker-pin",
          html: `
            <div style="background-color: #10b981; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2.5px solid #ffffff; cursor: move;">
              <span style="color: #ffffff; font-size: 16px;">📍</span>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker([currentLat, currentLng], {
          icon: pinIcon,
          draggable: true,
        }).addTo(map);

        // Marker drag event
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          const newLat = Math.round(pos.lat * 10000) / 10000;
          const newLng = Math.round(pos.lng * 10000) / 10000;
          setCurrentLat(newLat);
          setCurrentLng(newLng);
          onLocationChange({
            address: inputAddress,
            latitude: newLat,
            longitude: newLng,
          });
        });

        // Click map to place marker
        map.on("click", (e: any) => {
          const newLat = Math.round(e.latlng.lat * 10000) / 10000;
          const newLng = Math.round(e.latlng.lng * 10000) / 10000;
          marker.setLatLng([newLat, newLng]);
          setCurrentLat(newLat);
          setCurrentLng(newLng);
          onLocationChange({
            address: inputAddress,
            latitude: newLat,
            longitude: newLng,
          });
        });

        markerRef.current = marker;
        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (err: any) {
        setGeoError("Interactive pin preview unavailable.");
      }
    }

    initPickerMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when coords change
  const updateCoords = (newLat: number, newLng: number) => {
    setCurrentLat(newLat);
    setCurrentLng(newLng);

    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
      mapInstanceRef.current.panTo([newLat, newLng]);
    }

    onLocationChange({
      address: inputAddress,
      latitude: newLat,
      longitude: newLng,
    });
  };

  // Browser Geolocation
  const handleDetectLocation = () => {
    setGeoError(null);
    setIsLocating(true);

    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detectedLat = Math.round(pos.coords.latitude * 10000) / 10000;
        const detectedLng = Math.round(pos.coords.longitude * 10000) / 10000;
        updateCoords(detectedLat, detectedLng);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError("Location permission denied. Please enter coordinates manually or click the map.");
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError("Location signal unavailable.");
            break;
          case err.TIMEOUT:
            setGeoError("Location request timed out.");
            break;
          default:
            setGeoError("Failed to detect location.");
        }
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Address Geocode Lookup
  const handleAddressLookup = () => {
    if (!inputAddress.trim()) return;
    const resolved = approximateGeocode(inputAddress);
    updateCoords(resolved.latitude, resolved.longitude);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isLocating}
          className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
        >
          {isLocating ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Compass className="w-3 h-3" />
          )}
          Detect Current Location
        </button>
      </div>

      {/* Address Line with Geocode Trigger */}
      <div className="relative">
        <input
          type="text"
          value={inputAddress}
          onChange={(e) => {
            setInputAddress(e.target.value);
            onLocationChange({
              address: e.target.value,
              latitude: currentLat,
              longitude: currentLng,
            });
          }}
          onBlur={handleAddressLookup}
          placeholder="Street address, City, State ZIP"
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 pr-20"
        />
        <button
          type="button"
          onClick={handleAddressLookup}
          className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1"
        >
          <Search className="w-3 h-3" /> Pin
        </button>
      </div>

      {/* Lat/Long Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Latitude (-90 to 90)
          </label>
          <input
            type="number"
            step="0.0001"
            value={currentLat}
            onChange={(e) => updateCoords(parseFloat(e.target.value) || 0, currentLng)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Longitude (-180 to 180)
          </label>
          <input
            type="number"
            step="0.0001"
            value={currentLng}
            onChange={(e) => updateCoords(currentLat, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
          />
        </div>
      </div>

      {/* Geolocation Notice / Error Alert */}
      {geoError && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Volunteer Privacy Guard Note */}
      {isVolunteer && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-[11px] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            <strong>Volunteer Privacy Protection:</strong> Your exact street address is never published.
            Nearby NGOs and donors only see your generalized community radius.
          </span>
        </div>
      )}

      {/* Click-to-Pin Interactive Map Box */}
      <div className="rounded-xl overflow-hidden border border-slate-200 relative">
        <div ref={mapContainerRef} style={{ height: "180px", width: "100%" }} />
        <div className="absolute bottom-2 right-2 z-10 bg-white/90 backdrop-blur-xs text-[10px] text-slate-600 px-2 py-0.5 rounded shadow-xs font-medium">
          Drag pin or click map to reposition
        </div>
      </div>
    </div>
  );
}
