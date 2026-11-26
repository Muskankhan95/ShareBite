"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PickupCard } from "@/components/shared/PickupCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCards } from "@/components/ui/LoadingState";
import { volunteerService } from "@/lib/services/volunteer.service";
import { VolunteerStats } from "@/lib/db/repositories/volunteer.repo";
import { PickupTask, PickupStatus } from "@/types/pickup";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Bike,
  Navigation,
  Clock,
  Scale,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Flame,
  Power,
  RotateCw,
} from "lucide-react";

export default function VolunteerDashboardPage() {
  const { user } = useAuth();
  const userId = user?.id || "usr_vol_1";

  const [availablePickups, setAvailablePickups] = useState<PickupTask[]>([]);
  const [myPickups, setMyPickups] = useState<PickupTask[]>([]);
  const [stats, setStats] = useState<VolunteerStats>({
    availablePickups: 0,
    activePickups: 0,
    activeMission: null,
    completedDeliveries: 0,
    mealsTransported: 0,
    foodWeightTransportedKg: 0,
    distanceTravelledMiles: 0,
    volunteerPoints: 0,
    availabilityStatus: "available",
    verificationStatus: "verified",
    vehicleType: "Bike",
    preferredRadius: 5,
  });

  const [loading, setLoading] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [available, mine, volStats] = await Promise.all([
        volunteerService.getAvailablePickups(),
        volunteerService.getMyPickups(userId),
        volunteerService.getVolunteerStats(userId),
      ]);
      // Prioritize urgent and time-critical pickups
      const sortedByUrgency = [...available].sort((a, b) => {
        const getWeight = (p: any) => {
          if (p.urgency === "critical") return 4;
          if (p.urgency === "high") return 3;
          if (p.urgency === "medium") return 2;
          return 1;
        };
        return getWeight(b) - getWeight(a);
      });
      setAvailablePickups(sortedByUrgency);
      setMyPickups(mine);
      setStats(volStats);
    } catch (err: any) {
      console.error("Failed to load volunteer dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleToggleAvailability = async () => {
    const nextStatus = stats.availabilityStatus === "available" ? "unavailable" : "available";
    try {
      setTogglingAvailability(true);
      setActionError(null);
      await volunteerService.setAvailability(userId, nextStatus);
      setStats((prev) => ({ ...prev, availabilityStatus: nextStatus }));
      setActionSuccess(`Availability changed to ${nextStatus.toUpperCase()}`);
      setTimeout(() => setActionSuccess(null), 3500);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || "Failed to update availability.");
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleClaim = async (pickupId: string) => {
    try {
      setActionError(null);
      const res = await volunteerService.claimPickup(pickupId, userId);
      setActionSuccess(res.message || "Pickup successfully claimed! Safe travels.");
      setTimeout(() => setActionSuccess(null), 4000);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || "Could not claim pickup.");
    }
  };

  const handleUpdateStatus = async (pickupId: string, status: PickupStatus) => {
    try {
      setActionError(null);
      const res = await volunteerService.updatePickupStatus(pickupId, status, userId);
      setActionSuccess(res.message || `Status changed to ${status}`);
      setTimeout(() => setActionSuccess(null), 3500);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || "Failed to update pickup status.");
    }
  };

  const activeMission = stats.activeMission || myPickups.find(
    (p) => p.status === "accepted" || p.status === "assigned" || p.status === "at_pickup" || p.status === "picked_up" || p.status === "in_transit"
  );

  return (
    <DashboardLayout
      role="volunteer"
      title="Volunteer Courier Hub"
      description={`Welcome back, ${user?.name || "Marcus Vance"}. Vehicle: ${stats.vehicleType || "Bike"}. Ready to rescue meals.`}
      action={
        <div className="flex items-center gap-3">
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
              Available Pickups ({stats.availablePickups})
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Availability & Verification Banner */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 transition-colors ${
                stats.availabilityStatus === "available"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <Power className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Courier Status:{" "}
                  <span
                    className={
                      stats.availabilityStatus === "available"
                        ? "text-emerald-700"
                        : "text-slate-600"
                    }
                  >
                    {stats.availabilityStatus === "available" ? "Available for Pickups" : "Currently Unavailable"}
                  </span>
                </h3>
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    stats.availabilityStatus === "available"
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-slate-400"
                  }`}
                />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {stats.availabilityStatus === "available"
                  ? "You will receive nearby rescue notifications and can claim open routes."
                  : "Dispatch notifications paused. Set to Available when you are ready to deliver."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <Badge
              variant={stats.verificationStatus === "verified" ? "success" : "warning"}
              dot
            >
              {stats.verificationStatus === "verified" ? "Verified Courier" : "Pending Verification"}
            </Badge>

            <Button
              size="sm"
              variant={stats.availabilityStatus === "available" ? "outline" : "primary"}
              onClick={handleToggleAvailability}
              isLoading={togglingAvailability}
            >
              {stats.availabilityStatus === "available" ? "Go Unavailable" : "Go Available"}
            </Button>
          </div>
        </div>

        {/* Action Alerts */}
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

        {/* 6 Required Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Available Pickups"
            value={stats.availablePickups}
            subtext="Ready for courier claim"
            variant="blue"
            icon={<Bike className="w-5 h-5" />}
          />

          <StatCard
            label="Active Pickup"
            value={stats.activePickups}
            subtext="Currently assigned to you"
            variant="amber"
            icon={<Navigation className="w-5 h-5" />}
          />

          <StatCard
            label="Completed Deliveries"
            value={stats.completedDeliveries}
            subtext="Successfully delivered"
            variant="emerald"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />

          <StatCard
            label="Meals Transported"
            value={stats.mealsTransported}
            subtext="Portions delivered to NGOs"
            variant="emerald"
            icon={<Scale className="w-5 h-5" />}
          />

          <StatCard
            label="Distance Travelled"
            value={`${stats.distanceTravelledMiles} mi`}
            subtext="Total delivery routes"
            variant="blue"
            icon={<Clock className="w-5 h-5" />}
          />

          <StatCard
            label="Volunteer Points"
            value={`${stats.volunteerPoints} pts`}
            subtext="Community impact credits"
            variant="amber"
            icon={<Award className="w-5 h-5" />}
          />
        </div>

        {/* Current Active Rescue Mission (if any) */}
        {activeMission && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Your Active Rescue Mission
                </h2>
                <p className="text-xs text-slate-500">Pick up from donor and transport directly to destination shelter</p>
              </div>
              <Link
                href={`/volunteer/pickups/${activeMission.id}`}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                Open Full Mission Stepper <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <Card className="border-emerald-200 bg-emerald-50/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge status={activeMission.status} size="md" />
                      <Badge variant="warning" size="sm">{activeMission.urgency} urgency</Badge>
                      <span className="text-xs text-slate-500 font-medium">
                        {activeMission.servings} Servings • ~{activeMission.distanceMiles || activeMission.distanceKm} miles
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{activeMission.foodTitle}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/volunteer/pickups/${activeMission.id}`}>
                      <Button size="sm" variant="outline">
                        Mission Verification & Details
                      </Button>
                    </Link>

                    {(activeMission.status === "accepted" || activeMission.status === "assigned") && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateStatus(activeMission.id, "at_pickup")}
                      >
                        Arrived at Donor
                      </Button>
                    )}

                    {activeMission.status === "at_pickup" && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateStatus(activeMission.id, "picked_up")}
                      >
                        Confirm Picked Up
                      </Button>
                    )}

                    {activeMission.status === "picked_up" && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateStatus(activeMission.id, "in_transit")}
                      >
                        Start Transit
                      </Button>
                    )}

                    {activeMission.status === "in_transit" && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateStatus(activeMission.id, "delivered")}
                      >
                        Confirm Handover to Shelter
                      </Button>
                    )}

                    {activeMission.status === "delivered" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(activeMission.id, "completed")}
                      >
                        Complete Mission
                      </Button>
                    )}
                  </div>
                </div>

                {/* Waypoints */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider">
                      Origin Kitchen (Pickup)
                    </span>
                    <p className="font-semibold text-slate-900">{activeMission.donorName}</p>
                    <p className="text-slate-600">{activeMission.pickupAddress}</p>
                    <p className="text-slate-500 pt-1">Tel: {activeMission.donorPhone}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-blue-800 uppercase text-[10px] tracking-wider">
                      Shelter Dropoff (Delivery)
                    </span>
                    <p className="font-semibold text-slate-900">{activeMission.ngoName}</p>
                    <p className="text-slate-600">{activeMission.dropoffAddress}</p>
                    <p className="text-slate-500 pt-1">Tel: {activeMission.ngoPhone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Available Pickups in Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Available Missions Near You
              </h2>
              <p className="text-xs text-slate-500">
                Surplus food batches waiting for a volunteer courier to accept and transport
              </p>
            </div>
            <Link
              href="/volunteer/available"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View All ({availablePickups.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingCards count={3} />
          ) : availablePickups.length === 0 ? (
            <EmptyState
              title="No Pickups Needing Volunteers Right Now"
              description="Great job! All active food donations currently have couriers assigned. Check back shortly as donors post fresh meals."
              actionLabel="Refresh List"
              onAction={loadData}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {availablePickups.slice(0, 3).map((p) => (
                <PickupCard key={p.id} pickup={p} onClaim={handleClaim} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Deliveries List */}
        {myPickups.filter((p) => p.status === "delivered" || p.status === "completed").length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Recent Completed Missions</h2>
              <Link
                href="/volunteer/history"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View History
              </Link>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {myPickups
                    .filter((p) => p.status === "delivered" || p.status === "completed")
                    .slice(0, 3)
                    .map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{item.foodTitle}</p>
                          <p className="text-slate-500">
                            {item.servings} servings • From {item.donorName} to {item.ngoName}
                          </p>
                        </div>
                        <Badge variant="success" size="sm">✓ Delivered</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
