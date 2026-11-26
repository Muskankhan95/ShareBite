"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DonationCard } from "@/components/shared/DonationCard";
import { LoadingCards } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { donationService } from "@/lib/services/donation.service";
import { DonationItem } from "@/types/donation";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate } from "@/lib/utils";
import {
  Utensils,
  PlusCircle,
  Package,
  CheckCircle2,
  Clock,
  Weight,
  Layers,
  ArrowRight,
  Activity,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export default function DonorDashboardPage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [stats, setStats] = useState({
    totalDonations: 0,
    activeDonations: 0,
    completedDonations: 0,
    pendingDonations: 0,
    mealsRescued: 0,
    foodRescuedKg: 0,
    recentActivity: [] as Array<{
      id: string;
      title: string;
      status: string;
      servings: number;
      createdAt: string;
    }>,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const donorId = user?.id || "usr_donor_1";
        const [myDonations, donorStats] = await Promise.all([
          donationService.getDonations({ donorId }),
          donationService.getDonorStats(donorId),
        ]);
        setDonations(myDonations);
        if (donorStats) {
          setStats(donorStats);
        }
      } catch (err) {
        console.error("Failed to load donor dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const activeDonations = donations.filter((d) =>
    ["published", "available", "matched", "accepted", "pickup_assigned", "in_transit", "picked_up"].includes(
      d.status.toLowerCase()
    )
  );

  return (
    <DashboardLayout
      role="donor"
      title="Donor Dashboard"
      description={`Welcome back, ${user?.name || "Chef Marco"}. Monitor your surplus food rescues and live impact.`}
      action={
        <Link href="/donor/create">
          <Button size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Create Donation
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Metric Cards - Exact Prompt Requirements */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            label="Active Donations"
            value={stats.activeDonations}
            subtext="Live listings & in-transit"
            variant="emerald"
            icon={<Clock className="w-5 h-5" />}
          />

          <StatCard
            label="Completed Donations"
            value={stats.completedDonations}
            subtext="Delivered to verified NGOs"
            variant="blue"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />

          <StatCard
            label="Pending Donations"
            value={stats.pendingDonations}
            subtext="Drafts or awaiting match"
            variant="amber"
            icon={<Layers className="w-5 h-5" />}
          />

          <StatCard
            label="Meals Rescued"
            value={stats.mealsRescued.toLocaleString()}
            subtext="Portions delivered"
            variant="emerald"
            icon={<Utensils className="w-5 h-5" />}
          />

          <StatCard
            label="ShareBited"
            value={`${stats.foodRescuedKg.toLocaleString()} kg`}
            subtext="Weight rescued from waste"
            variant="blue"
            icon={<Weight className="w-5 h-5" />}
          />
        </div>

        {/* Quick CTA Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-emerald-200 text-xs font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> High Demand in Your Area
            </div>
            <h3 className="text-lg font-bold text-white">Have surplus food ready right now?</h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
              Post surplus trays, bakery items, or cooked meals in 60 seconds. Verified NGOs and nearby courier volunteers will be matched instantly.
            </p>
          </div>
          <Link href="/donor/create">
            <Button className="bg-white text-emerald-900 hover:bg-slate-100 font-bold shrink-0 shadow-xs">
              Post Surplus Donation
            </Button>
          </Link>
        </div>

        {/* Active Donations Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Active Food Surplus</h2>
              <p className="text-xs text-slate-500">Live listings being matched, accepted, or in transit</p>
            </div>
            <Link
              href="/donor/my-donations"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View All ({donations.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingCards count={3} />
          ) : activeDonations.length === 0 ? (
            <EmptyState
              title="No Active Donations"
              description="You do not have any surplus listings in progress right now. Post your first donation to help nearby shelters."
              actionLabel="Create Donation"
              actionHref="/donor/create"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeDonations.map((donation) => (
                <DonationCard key={donation.id} donation={donation} viewMode="donor" />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-base font-bold text-slate-900">Recent Activity</CardTitle>
              </div>
              <span className="text-xs text-slate-500">Real-time donation lifecycle updates</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <p className="text-xs text-slate-400">Loading recent activity...</p>
            ) : stats.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <Link
                          href={`/donor/donations/${activity.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-emerald-600 transition-colors"
                        >
                          {activity.title}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {activity.servings} portions • Created {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          activity.status === "completed" || activity.status === "delivered"
                            ? "success"
                            : activity.status === "matched" || activity.status === "accepted"
                            ? "info"
                            : activity.status === "cancelled" || activity.status === "expired"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {activity.status.replace("_", " ")}
                      </Badge>
                      <Link
                        href={`/donor/donations/${activity.id}`}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="text-xs">No recent activity found. Post your first donation to begin.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
