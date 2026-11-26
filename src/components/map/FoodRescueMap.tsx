"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Layers,
  Compass,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  Info,
  ExternalLink,
  ChevronRight,
  Clock,
  Package,
  Heart,
  Truck,
} from "lucide-react";
import { DEFAULT_MAP_CENTER, calculateHaversineDistance } from "@/lib/utils/geo";

export interface MapMarkerItem {
  id: string;
  type: "donation" | "ngo" | "volunteer";
  title?: string;
  name?: string;
  category?: string;
  servings?: number;
  quantity?: number;
  pickupAddress?: string;
  address?: string;
  donorName?: string;
  contactPerson?: string;
  capacity?: number;
  currentRequirement?: number;
  vehicleType?: string;
  preferredRadius?: number;
  availableUntil?: string;
  urgency?: "low" | "medium" | "high" | "critical";
  distanceKm?: number;
  latitude: number;
  longitude: number;
  isExactLocation?: boolean;
}

interface ShareBiteMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  showControls?: boolean;
  selectedRadiusKm?: number;
  onRadiusChange?: (radius: number) => void;
  onMarkerSelect?: (item: MapMarkerItem) => void;
  filterType?: "all" | "donations" | "ngos" | "volunteers";
  interactive?: boolean;
}

export default function ShareBiteMap({
  initialCenter = DEFAULT_MAP_CENTER,
  initialZoom = 13,
  height = "520px",
  showControls = true,
  selectedRadiusKm,
  onRadiusChange,
  onMarkerSelect,
  filterType = "all",
  interactive = true,
}: ShareBiteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const circleLayerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Markers Data
  const [donations, setDonations] = useState<MapMarkerItem[]>([]);
  const [ngos, setNgos] = useState<MapMarkerItem[]>([]);
  const [volunteers, setVolunteers] = useState<MapMarkerItem[]>([]);

  // Layer Visibility
  const [visibleLayers, setVisibleLayers] = useState({
    donations: filterType === "all" || filterType === "donations",
    ngos: filterType === "all" || filterType === "ngos",
    volunteers: filterType === "all" || filterType === "volunteers",
  });

  const [activeRadius, setActiveRadius] = useState<number>(selectedRadiusKm || 10);
  const [selectedItem, setSelectedItem] = useState<MapMarkerItem | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch explore map data
  const loadMapData = async (lat?: number, lng?: number, radius?: number) => {
    try {
      setIsLoading(true);
      setMapError(null);

      const params = new URLSearchParams();
      if (lat && lng) {
        params.append("lat", String(lat));
        params.append("lng", String(lng));
      }
      if (radius) {
        params.append("radiusKm", String(radius));
      }

      const res = await fetch(`/api/map/explore?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Unable to retrieve rescue map coordinates from server.");
      }

      const data = await res.json();
      setDonations(data.donations || []);
      setNgos(data.ngos || []);
      setVolunteers(data.volunteers || []);
    } catch (err: any) {
      setMapError(err.message || "Failed to load live map data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMapData(
      userLocation ? userLocation[0] : initialCenter[0],
      userLocation ? userLocation[1] : initialCenter[1],
      activeRadius
    );
  }, [activeRadius]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initLeaflet() {
      try {
        const L = (await import("leaflet")).default;

        if (!isMounted || !mapContainerRef.current) return;

        // If map already initialized, clear it
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          zoomControl: false,
          attributionControl: true,
        });

        // Add Zoom Control at bottom right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Add OpenStreetMap Tile Layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Add Layer Groups
        markersLayerRef.current = L.layerGroup().addTo(map);
        circleLayerRef.current = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
        setIsLoading(false);
      } catch (err: any) {
        if (isMounted) {
          setMapError("Could not initialize interactive map provider. Falling back to list view.");
          setIsLoading(false);
        }
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers on Map when Data or Layers Change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    async function renderMarkers() {
      const L = (await import("leaflet")).default;
      const markersLayer = markersLayerRef.current;
      const circleLayer = circleLayerRef.current;
      markersLayer.clearLayers();
      circleLayer.clearLayers();

      const allRenderedPoints: [number, number][] = [];

      // Render Active Radius Circle
      if (userLocation || initialCenter) {
        const center = userLocation || initialCenter;
        const radiusMeters = activeRadius * 1000;

        const circle = L.circle(center, {
          color: "#10b981",
          fillColor: "#10b981",
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: "4, 6",
          radius: radiusMeters,
        });
        circle.addTo(circleLayer);
      }

      // Render Donations (🟢 Green)
      if (visibleLayers.donations) {
        donations.forEach((item) => {
          if (!item.latitude || !item.longitude) return;

          const icon = L.divIcon({
            className: "donation-pin",
            html: `
              <div style="background-color: #10b981; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(16, 185, 129, 0.45); border: 2.5px solid #ffffff; cursor: pointer; transition: transform 0.15s ease;">
                <span style="color: #ffffff; font-size: 15px;">🍲</span>
              </div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -18],
          });

          const marker = L.marker([item.latitude, item.longitude], { icon });

          const popupContent = `
            <div style="font-family: inherit; font-size: 12px; max-width: 230px; line-height: 1.4;">
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                <span style="background: #ecfdf5; color: #047857; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px;">AVAILABLE FOOD</span>
                <span style="background: #f1f5f9; color: #475569; font-size: 10px; padding: 2px 6px; border-radius: 4px;">${item.category || "Meal"}</span>
              </div>
              <h4 style="font-weight: 700; font-size: 13px; color: #0f172a; margin: 0 0 4px 0;">${item.title || "Food Surplus"}</h4>
              <p style="color: #475569; margin: 0 0 6px 0; font-size: 11px;">${item.donorName || "Food Donor"} &bull; <strong>${item.servings || 0} servings</strong> (${item.quantity || 0} kg)</p>
              <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
                📍 ${item.pickupAddress || "San Francisco"}
              </div>
              <a href="/donor/donations/${item.id}" style="display: block; text-align: center; background: #10b981; color: #ffffff; text-decoration: none; padding: 5px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;">
                View Donation Details &rarr;
              </a>
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.on("click", () => {
            setSelectedItem(item);
            if (onMarkerSelect) onMarkerSelect(item);
          });

          marker.addTo(markersLayer);
          allRenderedPoints.push([item.latitude, item.longitude]);
        });
      }

      // Render Verified NGOs (🔵 Blue)
      if (visibleLayers.ngos) {
        ngos.forEach((ngo) => {
          if (!ngo.latitude || !ngo.longitude) return;

          const icon = L.divIcon({
            className: "ngo-pin",
            html: `
              <div style="background-color: #2563eb; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(37, 99, 235, 0.45); border: 2.5px solid #ffffff; cursor: pointer;">
                <span style="color: #ffffff; font-size: 15px;">🏛️</span>
              </div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -18],
          });

          const marker = L.marker([ngo.latitude, ngo.longitude], { icon });

          const popupContent = `
            <div style="font-family: inherit; font-size: 12px; max-width: 230px; line-height: 1.4;">
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                <span style="background: #eff6ff; color: #1d4ed8; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px;">VERIFIED NGO</span>
              </div>
              <h4 style="font-weight: 700; font-size: 13px; color: #0f172a; margin: 0 0 4px 0;">${ngo.name || "Community Organization"}</h4>
              <p style="color: #475569; margin: 0 0 6px 0; font-size: 11px;">Capacity: <strong>${ngo.capacity || 100} meals/day</strong></p>
              <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
                📍 ${ngo.address || "Community Center"}
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.on("click", () => {
            setSelectedItem(ngo);
            if (onMarkerSelect) onMarkerSelect(ngo);
          });

          marker.addTo(markersLayer);
          allRenderedPoints.push([ngo.latitude, ngo.longitude]);
        });
      }

      // Render Available Volunteers (🟠 Orange - Privacy Protected)
      if (visibleLayers.volunteers) {
        volunteers.forEach((vol) => {
          if (!vol.latitude || !vol.longitude) return;

          const icon = L.divIcon({
            className: "volunteer-pin",
            html: `
              <div style="background-color: #f59e0b; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(245, 158, 11, 0.45); border: 2.5px solid #ffffff; cursor: pointer;">
                <span style="color: #ffffff; font-size: 15px;">🚲</span>
              </div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -18],
          });

          const marker = L.marker([vol.latitude, vol.longitude], { icon });

          const popupContent = `
            <div style="font-family: inherit; font-size: 12px; max-width: 230px; line-height: 1.4;">
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                <span style="background: #fffbeb; color: #b45309; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px;">COURIER BASE</span>
                <span style="background: #f1f5f9; color: #475569; font-size: 10px; padding: 2px 6px; border-radius: 4px;">${vol.vehicleType || "Bike"}</span>
              </div>
              <h4 style="font-weight: 700; font-size: 13px; color: #0f172a; margin: 0 0 2px 0;">${vol.name || "Available Volunteer"}</h4>
              <p style="color: #64748b; font-size: 11px; margin: 0 0 6px 0;">🛡️ <em>Approximate service zone (~${vol.preferredRadius || 5} km radius)</em></p>
              <div style="font-size: 11px; color: #475569;">
                Status: <span style="color: #15803d; font-weight: 600;">Active & Ready</span>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.on("click", () => {
            setSelectedItem(vol);
            if (onMarkerSelect) onMarkerSelect(vol);
          });

          marker.addTo(markersLayer);
          allRenderedPoints.push([vol.latitude, vol.longitude]);
        });
      }

      // Add User Location Marker if available
      if (userLocation) {
        const userIcon = L.divIcon({
          className: "user-location-pin",
          html: `
            <div style="background-color: #0f172a; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 6px rgba(15, 23, 42, 0.2); border: 3px solid #ffffff;">
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        L.marker(userLocation, { icon: userIcon })
          .bindPopup("<strong>Your Current Location</strong>")
          .addTo(markersLayer);
      }
    }

    renderMarkers();
  }, [donations, ngos, volunteers, visibleLayers, userLocation, activeRadius]);

  // Handle Geolocation Request
  const handleLocateMe = () => {
    setPermissionError(null);
    if (!navigator.geolocation) {
      setPermissionError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(userCoords);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(userCoords, 14, { duration: 1.2 });
        }
        loadMapData(userCoords[0], userCoords[1], activeRadius);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setPermissionError(
              "Location permission was denied. Defaulting to regional San Francisco coordinates."
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setPermissionError("Location signal unavailable. Using default city center.");
            break;
          case err.TIMEOUT:
            setPermissionError("Location request timed out. Please try again.");
            break;
          default:
            setPermissionError("Unable to acquire location.");
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleRadiusSelect = (radius: number) => {
    setActiveRadius(radius);
    if (onRadiusChange) onRadiusChange(radius);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      {/* Top Map Controls Bar */}
      {showControls && (
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 z-10">
          {/* Layer Filter Toggles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Layers:
            </span>

            <button
              type="button"
              onClick={() =>
                setVisibleLayers((prev) => ({ ...prev, donations: !prev.donations }))
              }
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                visibleLayers.donations
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                  : "bg-slate-50 text-slate-400 border border-slate-200"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Donations ({donations.length})
            </button>

            <button
              type="button"
              onClick={() => setVisibleLayers((prev) => ({ ...prev, ngos: !prev.ngos }))}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                visibleLayers.ngos
                  ? "bg-blue-50 text-blue-700 border border-blue-300"
                  : "bg-slate-50 text-slate-400 border border-slate-200"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              NGOs ({ngos.length})
            </button>

            <button
              type="button"
              onClick={() =>
                setVisibleLayers((prev) => ({ ...prev, volunteers: !prev.volunteers }))
              }
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                visibleLayers.volunteers
                  ? "bg-amber-50 text-amber-700 border border-amber-300"
                  : "bg-slate-50 text-slate-400 border border-slate-200"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Volunteers ({volunteers.length})
            </button>
          </div>

          {/* Configurable Radius Selector & Current Location */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
              <span className="px-2 text-slate-500 font-medium">Radius:</span>
              {[1, 5, 10, 25].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRadiusSelect(r)}
                  className={`px-2 py-1 rounded-md font-semibold transition-all ${
                    activeRadius === r
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLocateMe}
              title="Locate my position"
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1 text-xs font-medium"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">My Location</span>
            </button>
          </div>
        </div>
      )}

      {/* Geolocation Notice / Error Banner */}
      {permissionError && (
        <div className="p-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{permissionError}</span>
          </div>
          <button
            onClick={() => setPermissionError(null)}
            className="text-amber-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Map Container */}
      <div className="relative">
        <div ref={mapContainerRef} style={{ height, width: "100%" }} className="z-0" />

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-2 text-slate-700">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-semibold">Loading live coordinates...</span>
            </div>
          </div>
        )}

        {/* Map Loading Failure Fallback */}
        {mapError && (
          <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center z-20">
            <AlertCircle className="w-10 h-10 text-amber-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-900">Map Service Unavailable</h4>
            <p className="text-xs text-slate-600 max-w-md mt-1 mb-4">{mapError}</p>
            <button
              onClick={() => {
                loadMapData();
                window.location.reload();
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
            >
              Retry Loading Map
            </button>
          </div>
        )}

        {/* Floating Privacy Notice badge */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 shadow-xs flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
          <span>Volunteer exact addresses are fuzzed for safety & privacy.</span>
        </div>
      </div>

      {/* Selected Marker Detail Drawer (Mobile & Desktop) */}
      {selectedItem && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 font-bold ${
                selectedItem.type === "donation"
                  ? "bg-emerald-600"
                  : selectedItem.type === "ngo"
                  ? "bg-blue-600"
                  : "bg-amber-600"
              }`}
            >
              {selectedItem.type === "donation" ? "🍲" : selectedItem.type === "ngo" ? "🏛️" : "🚲"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {selectedItem.type === "donation"
                    ? "Surplus Food Donation"
                    : selectedItem.type === "ngo"
                    ? "Verified NGO Partner"
                    : "Volunteer Courier"}
                </span>
                {selectedItem.distanceKm !== undefined && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    ~{selectedItem.distanceKm} km away
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                {selectedItem.title || selectedItem.name}
              </h4>
              <p className="text-xs text-slate-600">
                {selectedItem.pickupAddress || selectedItem.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {selectedItem.type === "donation" && (
              <a
                href={`/donor/donations/${selectedItem.id}`}
                className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1"
              >
                Inspect Listing <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={() => setSelectedItem(null)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
