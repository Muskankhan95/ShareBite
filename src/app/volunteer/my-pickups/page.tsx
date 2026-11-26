"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PickupCard } from "@/components/shared/PickupCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCards } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/Button";
import { volunteerService } from "@/lib/services/volunteer.service";
import { PickupTask, PickupStatus } from "@/types/pickup";
import { useAuth } from "@/lib/auth/auth-context";
import { Bike, CheckCircle2, AlertCircle, RotateCw } from "lucide-react";

export default function MyPickupsPage() {
  const { user } = useAuth();
  const userId = user?.id || "usr_vol_1";

  const [pickups, setPickups] = useState<PickupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "completed" | "all">("active");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await volunteerService.getMyPickups(userId, tab);
      setPickups(data);
    } catch (err: any) {
      console.error("Failed to load my pickups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, tab]);

  const handleUpdateStatus = async (pickupId: string, status: PickupStatus) => {
    try {
      setActionError(null);
      const res = await volunteerService.updatePickupStatus(pickupId, status, userId);
      setActionSuccess(res.message || `Status updated to ${status}`);
      setTimeout(() => setActionSuccess(null), 3500);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || "Failed to update status.");
    }
  };

  return (
    <DashboardLayout
      role="volunteer"
      title="My Rescue Deliveries"
      description="Manage the food rescue missions you have claimed. Update status as you arrive at the donor and deliver to the NGO."
      action={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Link href="/volunteer/available">
            <Button size="sm" leftIcon={<Bike className="w-4 h-4" />}>
              Find More Pickups
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setTab("active")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              tab === "active"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Active Missions ({pickups.filter((p) => p.status !== "delivered" && p.status !== "completed").length})
          </button>
          <button
            onClick={() => setTab("completed")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              tab === "completed"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Delivered & Completed
          </button>
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              tab === "all"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            All Missions
          </button>
        </div>

        {/* Feedback Messages */}
        {actionError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
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

        {/* Pickups List */}
        {loading ? (
          <LoadingCards count={2} />
        ) : pickups.length === 0 ? (
          <EmptyState
            title={tab === "active" ? "No Active Rescue Missions" : "No Missions Found"}
            description={
              tab === "active"
                ? "You do not have any claimed deliveries in progress right now. Explore available pickups to start rescuing meals."
                : "No delivery history recorded in this view."
            }
            actionLabel="Find Available Pickups"
            actionHref="/volunteer/available"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pickups.map((p) => (
              <PickupCard
                key={p.id}
                pickup={p}
                isVolunteerAssigned={true}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
