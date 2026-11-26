"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PickupCard } from "@/components/shared/PickupCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCards } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { volunteerService } from "@/lib/services/volunteer.service";
import { PickupTask } from "@/types/pickup";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Bike,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Filter,
  Clock,
  RotateCw,
  ShieldAlert,
} from "lucide-react";

export default function AvailablePickupsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || "usr_vol_1";

  const [pickups, setPickups] = useState<PickupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [distanceFilter, setDistanceFilter] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState("All");

  const loadAvailable = async () => {
    try {
      setLoading(true);
      const maxDistance = distanceFilter !== "All" ? parseFloat(distanceFilter) : undefined;
      const data = await volunteerService.getAvailablePickups({
        category: categoryFilter !== "All" ? categoryFilter : undefined,
        maxDistance,
        urgency: urgencyFilter !== "All" ? urgencyFilter : undefined,
      });
      const sorted = [...data].sort((a, b) => {
        const getWeight = (p: any) => {
          if (p.urgency === "critical") return 4;
          if (p.urgency === "high") return 3;
          if (p.urgency === "medium") return 2;
          return 1;
        };
        return getWeight(b) - getWeight(a);
      });
      setPickups(sorted);
    } catch (err: any) {
      console.error("Failed to load available pickups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailable();
  }, [categoryFilter, distanceFilter, urgencyFilter]);

  const handleClaim = async (pickupId: string) => {
    try {
      setActionError(null);
      const res = await volunteerService.claimPickup(pickupId, userId);
      setActionSuccess(res.message || "Pickup accepted! Directing you to your mission route...");
      setTimeout(() => {
        router.push("/volunteer/my-pickups");
      }, 1200);
    } catch (err: any) {
      setActionError(err.message || "Could not claim pickup.");
      await loadAvailable();
    }
  };

  return (
    <DashboardLayout
      role="volunteer"
      title="Available Pickup Missions"
      description="Claim surplus batches waiting for transport from verified commercial donors to partner shelters."
      action={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadAvailable}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Link href="/volunteer/my-pickups">
            <Button size="sm" variant="outline">
              My Active Missions
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Bike className="w-4 h-4 text-amber-700" />
              Volunteer Courier Dispatch Guidelines
            </h3>
            <p className="text-xs text-amber-800 max-w-2xl leading-relaxed">
              Accept only missions you can begin promptly. Once claimed, the donor kitchen is notified
              to package the meal for your arrival. Always verify container temperature seal at pickup.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-white rounded-lg border border-amber-300 text-amber-900 shrink-0 shadow-xs">
            {pickups.length} Open Routes
          </span>
        </div>

        {/* Alerts */}
        {actionError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-rose-600 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters:</span>
          </div>

          <div className="w-48">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: "All", label: "All Categories" },
                { value: "Cooked Meals", label: "Cooked Meals" },
                { value: "Bakery & Bread", label: "Bakery & Bread" },
                { value: "Fresh Produce", label: "Fresh Produce" },
                { value: "Packaged Food", label: "Packaged Food" },
                { value: "Dairy & Eggs", label: "Dairy & Eggs" },
              ]}
            />
          </div>

          <div className="w-40">
            <Select
              value={distanceFilter}
              onChange={(e) => setDistanceFilter(e.target.value)}
              options={[
                { value: "All", label: "Any Distance" },
                { value: "2", label: "Within 2 miles" },
                { value: "5", label: "Within 5 miles" },
                { value: "10", label: "Within 10 miles" },
                { value: "25", label: "Within 25 miles" },
              ]}
            />
          </div>

          <div className="w-40">
            <Select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              options={[
                { value: "All", label: "Any Urgency" },
                { value: "critical", label: "Critical (<2 hrs)" },
                { value: "high", label: "High (<4 hrs)" },
                { value: "medium", label: "Medium (<8 hrs)" },
                { value: "low", label: "Low (>8 hrs)" },
              ]}
            />
          </div>

          {(categoryFilter !== "All" || distanceFilter !== "All" || urgencyFilter !== "All") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCategoryFilter("All");
                setDistanceFilter("All");
                setUrgencyFilter("All");
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Pickups Grid */}
        {loading ? (
          <LoadingCards count={3} />
        ) : pickups.length === 0 ? (
          <EmptyState
            title="No Matching Missions Available"
            description="There are currently no open pickup requests matching your criteria. Try widening your filters or check back shortly."
            actionLabel="Reset Filters"
            onAction={() => {
              setCategoryFilter("All");
              setDistanceFilter("All");
              setUrgencyFilter("All");
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pickups.map((p) => (
              <PickupCard key={p.id} pickup={p} onClaim={handleClaim} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
