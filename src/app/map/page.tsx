"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import ShareBiteMap, { MapMarkerItem } from "@/components/map/ShareBiteMap";
import {
  MapPin,
  Clock,
  Package,
  Layers,
  Heart,
  Truck,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Info,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function ExploreMapPage() {
  const [selectedRadius, setSelectedRadius] = useState<number>(10);
  const [selectedItem, setSelectedItem] = useState<MapMarkerItem | null>(null);
  const [nearbyList, setNearbyList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadDonations() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/ngo/nearby?radiusKm=${selectedRadius}`);
        if (res.ok) {
          const data = await res.json();
          setNearbyList(data.donations || []);
        }
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadDonations();
  }, [selectedRadius]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Title & Mission Banner */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Geographic Network
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              ShareBite Interactive Community Map
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Track real-time surplus edible food listings, verified community NGO partners, and
              active volunteer dispatch hubs across the metropolitan grid.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <Link
              href="/donor/create"
              className="flex-1 sm:flex-none text-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              Donate Food
            </Link>
            <Link
              href="/login"
              className="flex-1 sm:flex-none text-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all"
            >
              Portal Login
            </Link>
          </div>
        </div>

        {/* Legend Quick Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
              🍲
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">🟢 Available Donations</p>
              <p className="text-[11px] text-slate-500">Fresh surplus ready for NGO pickup</p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
              🏛️
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">🔵 Verified NGOs</p>
              <p className="text-[11px] text-slate-500">Shelters & community kitchens</p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
              🚲
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">🟠 Available Volunteers</p>
              <p className="text-[11px] text-slate-500">Active couriers (privacy-fuzzed zone)</p>
            </div>
          </div>
        </div>

        {/* Map & Listings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Map Component (2 Columns on large screens) */}
          <div className="lg:col-span-2 space-y-4">
            <ShareBiteMap
              height="580px"
              selectedRadiusKm={selectedRadius}
              onRadiusChange={setSelectedRadius}
              onMarkerSelect={setSelectedItem}
            />
          </div>

          {/* Side Panel: Active Listings within Radius */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Food Within {selectedRadius} km
                  </h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {nearbyList.length} Listings
                </span>
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Calculating nearby listings...
                </div>
              ) : nearbyList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No active donations found within {selectedRadius} km. Try expanding the radius.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {nearbyList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-emerald-200 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">
                            {item.foodType}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                            {item.title}
                          </h4>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
                          ~{item.distanceKm ?? item.distanceMiles ?? 1.5} km
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        📍 {item.pickupAddress?.street || "Pickup Address"}
                      </p>

                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-semibold">
                          {item.servingsEstimate} Servings ({item.quantity} kg)
                        </span>

                        <Link
                          href={`/donor/donations/${item.id}`}
                          className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5"
                        >
                          Details <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy & Safety Information Box */}
            <div className="p-4 bg-emerald-950 text-emerald-100 rounded-2xl border border-emerald-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-white">
                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                Geographic Privacy Notice
              </div>
              <p className="text-emerald-200/80 leading-relaxed text-[11px]">
                Volunteer exact residential addresses are automatically obscured using geographic
                fuzzing to maintain courier security while displaying coverage zones.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
