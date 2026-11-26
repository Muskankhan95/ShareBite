"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCards } from "@/components/ui/LoadingState";
import { volunteerService } from "@/lib/services/volunteer.service";
import { VolunteerStats } from "@/lib/db/repositories/volunteer.repo";
import { PickupTask } from "@/types/pickup";
import { useAuth } from "@/lib/auth/auth-context";
import { Bike, Clock, Award, CheckCircle2, ArrowRight, RotateCw, Scale } from "lucide-react";

export default function VolunteerDeliveryHistoryPage() {
  const { user } = useAuth();
  const userId = user?.id || "usr_vol_1";

  const [deliveries, setDeliveries] = useState<PickupTask[]>([]);
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [allMyPickups, volStats] = await Promise.all([
        volunteerService.getMyPickups(userId, "completed"),
        volunteerService.getVolunteerStats(userId),
      ]);
      setDeliveries(allMyPickups);
      setStats(volStats);
    } catch (err: any) {
      console.error("Failed to load delivery history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  return (
    <DashboardLayout
      role="volunteer"
      title="Courier Delivery History"
      description="Permanent record of all completed food rescue missions and community service verification."
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
              Find New Pickups
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Real Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard
            label="Completed Missions"
            value={`${stats.completedDeliveries} Deliveries`}
            subtext="Fulfillments recorded"
            variant="emerald"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatCard
            label="Meals Transported"
            value={`${stats.mealsTransported} Servings`}
            subtext="Delivered to food banks & shelters"
            variant="blue"
            icon={<Scale className="w-5 h-5" />}
          />
          <StatCard
            label="Distance Covered"
            value={`${stats.distanceTravelledMiles} Miles`}
            subtext="Clean transit routes logged"
            variant="amber"
            icon={<Bike className="w-5 h-5" />}
          />
          <StatCard
            label="Volunteer Points"
            value={`${stats.volunteerPoints} Pts`}
            subtext="Community credit score"
            variant="emerald"
            icon={<Award className="w-5 h-5" />}
          />
        </div>

        {/* Deliveries Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6">
                <LoadingCards count={1} />
              </div>
            ) : deliveries.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No Delivery History Yet"
                  description="You have not completed any delivery missions yet. Accept and fulfill available pickups to build your permanent impact record."
                  actionLabel="Explore Available Pickups"
                  actionHref="/volunteer/available"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Food Batch</th>
                      <th className="px-6 py-3.5">Origin Kitchen</th>
                      <th className="px-6 py-3.5">Destination Shelter</th>
                      <th className="px-6 py-3.5">Portions & Distance</th>
                      <th className="px-6 py-3.5">Delivered Date</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{d.foodTitle}</p>
                          <span className="text-[11px] text-emerald-700 font-semibold uppercase">
                            {d.foodType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-700">
                          {d.donorName}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-700">
                          {d.ngoName}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {d.servings} Servings • ~{d.distanceMiles || d.distanceKm} mi
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {d.deliveredAt
                            ? new Date(d.deliveredAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Recently"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="success" size="sm">
                            ✓ {d.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/volunteer/pickups/${d.id}`}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center justify-end gap-1"
                          >
                            <span>Receipt</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
