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
import { ngoService } from "@/lib/services/ngo.service";
import { DonationItem } from "@/types/donation";
import { NGOVerificationStatus } from "@/types/ngo";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate } from "@/lib/utils";
import {
  Building2,
  MapPin,
  ClipboardList,
  CheckCircle2,
  Users,
  Utensils,
  ArrowRight,
  PlusCircle,
  Activity,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function NGODashboardPage() {
  const { user } = useAuth();
  const [nearbyDonations, setNearbyDonations] = useState<Array<DonationItem & { distanceMiles: number; urgencyLevel: "urgent" | "standard" }>>([]);
  const [stats, setStats] = useState({
    availableNearbyFood: 0,
    activeRequests: 0,
    acceptedDonations: 0,
    completedDonations: 0,
    mealsReceived: 0,
    verificationStatus: "verified" as NGOVerificationStatus,
    capacityPerDay: 100,
    currentRequirement: 50,
    recentActivity: [] as Array<{
      id: string;
      type: string;
      title: string;
      status: string;
      servings: number;
      date: string;
    }>,
  });
  const [loading, setLoading] = useState(true);
  const [claimLoadingId, setClaimLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    try {
      const ngoUserId = user?.id || "usr_ngo_1";
      const [donations, ngoStats] = await Promise.all([
        ngoService.getNearbyAvailableDonations(),
        ngoService.getNGOStats(ngoUserId),
      ]);
      // Prioritize critical and high-urgency donations dynamically
      const sortedByUrgency = [...donations].sort((a, b) => {
        const getWeight = (d: any) => {
          const mins = Math.max(0, Math.round((new Date(d.expiresAt || d.availableUntil).getTime() - Date.now()) / (60 * 1000)));
          if (mins <= 60) return 4;
          if (mins <= 120) return 3;
          if (mins <= 240) return 2;
          return 1;
        };
        return getWeight(b) - getWeight(a);
      });
      setNearbyDonations(sortedByUrgency);
      if (ngoStats) {
        setStats(ngoStats as any);
      }
    } catch (err) {
      console.error("Failed to load NGO dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleClaimDonation = async (donation: DonationItem) => {
    if (stats.verificationStatus !== "verified") {
      setFeedbackMessage({
        type: "error",
        text: `Action Restricted: Your organization status is "${stats.verificationStatus}". Only verified NGOs can accept food donations.`,
      });
      return;
    }

    setClaimLoadingId(donation.id);
    setFeedbackMessage(null);
    try {
      const ngoUserId = user?.id || "usr_ngo_1";
      const res = await ngoService.acceptDonation({
        donationId: donation.id,
        ngoUserId,
      });
      setFeedbackMessage({
        type: "success",
        text: res.message || `Successfully accepted ${donation.title}! A courier volunteer will be dispatched.`,
      });
      loadData();
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to claim food donation.",
      });
    } finally {
      setClaimLoadingId(null);
    }
  };

  const isVerified = stats.verificationStatus === "verified";

  return (
    <DashboardLayout
      role="ngo"
      title="NGO Command Hub"
      description={`Welcome, ${user?.organizationName || "Hope Kitchen & Shelter"}. Review nearby surplus food and active incoming rescues.`}
      action={
        <div className="flex gap-2">
          <Link href="/ngo/requests">
            <Button size="sm" variant="outline" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Post Food Request
            </Button>
          </Link>
          <Link href="/ngo/nearby">
            <Button size="sm" leftIcon={<MapPin className="w-4 h-4" />}>
              Find Nearby Food
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Verification Status Banner */}
        {!isVerified ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">
                  Organization Verification Status: <span className="uppercase text-amber-800">{stats.verificationStatus}</span>
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Only verified NGOs can accept food donations. You can browse nearby listings and update your organization documentation in your Profile.
                </p>
              </div>
            </div>
            <Link href="/ngo/profile">
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0">
                View Verification Details
              </Button>
            </Link>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>Verified Community NGO:</strong> Authorized to claim and distribute surplus food donations.
              </span>
            </div>
            <span className="font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
              Capacity: {stats.capacityPerDay} meals/day
            </span>
          </div>
        )}

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
              feedbackMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            <span>{feedbackMessage.text}</span>
            <button onClick={() => setFeedbackMessage(null)} className="font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* 5 Metric Cards - Exact Prompt Requirements */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            label="Available Nearby Food"
            value={stats.availableNearbyFood}
            subtext="Ready for immediate claim"
            variant="emerald"
            icon={<MapPin className="w-5 h-5" />}
          />

          <StatCard
            label="Active Requests"
            value={stats.activeRequests}
            subtext="Broadcast daily needs"
            variant="amber"
            icon={<ClipboardList className="w-5 h-5" />}
          />

          <StatCard
            label="Accepted Donations"
            value={stats.acceptedDonations}
            subtext="Inbound & volunteer en route"
            variant="blue"
            icon={<Clock className="w-5 h-5" />}
          />

          <StatCard
            label="Completed Donations"
            value={stats.completedDonations}
            subtext="Safely received & served"
            variant="emerald"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />

          <StatCard
            label="Meals Received"
            value={stats.mealsReceived.toLocaleString()}
            subtext="Beneficiary portions fed"
            variant="blue"
            icon={<Utensils className="w-5 h-5" />}
          />
        </div>

        {/* Nearby Available Food Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Available Food Surplus Nearby</h2>
              <p className="text-xs text-slate-500">
                Prioritizing critical & high-urgency food rescues to prevent edible waste
              </p>
            </div>
            <Link
              href="/ngo/nearby"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Explore All Radar ({nearbyDonations.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingCards count={3} />
          ) : nearbyDonations.length === 0 ? (
            <EmptyState
              title="No Surplus Food Currently Available"
              description="All nearby donations have been claimed. Post a daily requirement so donors can route surplus to you."
              actionLabel="Post Food Request"
              actionHref="/ngo/requests"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {nearbyDonations.slice(0, 3).map((donation) => (
                <div key={donation.id} className="relative flex flex-col justify-between">
                  <DonationCard
                    donation={donation}
                    viewMode="ngo"
                    actionLabel={
                      claimLoadingId === donation.id
                        ? "Claiming..."
                        : isVerified
                        ? "Claim This Donation"
                        : "Verification Required"
                    }
                    onAction={() => handleClaimDonation(donation)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-base font-bold text-slate-900">Recent NGO Activity</CardTitle>
              </div>
              <span className="text-xs text-slate-500">Live rescue coordination stream</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <p className="text-xs text-slate-400">Loading activity feed...</p>
            ) : stats.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.recentActivity.map((activity) => (
                  <div key={`${activity.id}-${activity.type}`} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          activity.type === "delivered"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {activity.type === "delivered" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Utensils className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {activity.servings} portions • {formatDate(activity.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          activity.type === "delivered"
                            ? "success"
                            : activity.status === "in_transit" || activity.status === "picked_up"
                            ? "info"
                            : "warning"
                        }
                      >
                        {activity.status.replace("_", " ")}
                      </Badge>
                      <Link href="/ngo/accepted" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        Track
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="text-xs">No activity yet. Claim available surplus food to begin nourishing your shelter.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
