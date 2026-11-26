"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingCards } from "@/components/ui/LoadingState";
import { adminService } from "@/lib/services/admin.service";
import {
  Leaf,
  Droplet,
  Scale,
  Utensils,
  TrendingUp,
  Award,
  Clock,
  RotateCw,
  Building2,
  Users,
  Bike,
  CheckCircle2,
  Ban,
  PieChart,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>({
    foodCategories: [],
    completedVsExpired: { completed: 0, expired: 0, cancelled: 0, active: 0 },
    userDistribution: { donors: 0, ngos: 0, volunteers: 0 },
    topDonors: [],
    topNgos: [],
    vehicles: [],
  });
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAnalytics();
      if (data) setAnalytics(data);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const { completedVsExpired, foodCategories, userDistribution, topDonors, topNgos, vehicles } = analytics;
  const totalPipeline =
    (completedVsExpired.completed || 0) +
    (completedVsExpired.expired || 0) +
    (completedVsExpired.cancelled || 0) +
    (completedVsExpired.active || 0) || 1;

  const completedPct = Math.round(((completedVsExpired.completed || 0) / totalPipeline) * 100);
  const expiredPct = Math.round(((completedVsExpired.expired || 0) / totalPipeline) * 100);
  const activePct = Math.round(((completedVsExpired.active || 0) / totalPipeline) * 100);

  return (
    <DashboardLayout
      role="admin"
      title="Platform Impact & Governance Analytics"
      description="Audited sustainability benchmarks, fulfillment pipeline ratios, and entity participation directly from SQLite."
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={loadAnalytics}
          leftIcon={<RotateCw className="w-3.5 h-3.5" />}
        >
          Refresh Analytics
        </Button>
      }
    >
      <div className="space-y-8">
        {loading ? (
          <LoadingCards count={3} />
        ) : (
          <>
            {/* Pipeline Overview: Completed vs Expired vs Active */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Donation Fulfillment Pipeline (Completed vs. Expired vs. Active)
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Surplus redistribution efficiency ratio across all recorded batches
                  </p>
                </div>
                <Badge variant="success" size="sm">
                  {completedPct}% Delivery Fulfillment
                </Badge>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Visual Ratio Progress Bar */}
                <div className="space-y-2">
                  <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${completedPct}%` }}
                      title={`Completed: ${completedVsExpired.completed}`}
                    />
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${activePct}%` }}
                      title={`Active: ${completedVsExpired.active}`}
                    />
                    <div
                      className="h-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${expiredPct}%` }}
                      title={`Expired: ${completedVsExpired.expired}`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span>Completed / Delivered ({completedVsExpired.completed}) - <strong>{completedPct}%</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>Active Pipeline ({completedVsExpired.active}) - <strong>{activePct}%</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500" />
                      <span>Expired / Unclaimed ({completedVsExpired.expired}) - <strong>{expiredPct}%</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-slate-400" />
                      <span>Cancelled Listings ({completedVsExpired.cancelled})</span>
                    </div>
                  </div>
                </div>

                {/* Submetrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-800 uppercase block">Successful Rescues</span>
                    <p className="text-2xl font-bold text-emerald-950 mt-1">{completedVsExpired.completed} Batches</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Delivered to partner charities</p>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                    <span className="text-xs font-bold text-blue-800 uppercase block">In-Progress Pipeline</span>
                    <p className="text-2xl font-bold text-blue-950 mt-1">{completedVsExpired.active} Batches</p>
                    <p className="text-xs text-blue-700 mt-0.5">Assigned to couriers or awaiting claim</p>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                    <span className="text-xs font-bold text-rose-800 uppercase block">Expired Unclaimed</span>
                    <p className="text-2xl font-bold text-rose-950 mt-1">{completedVsExpired.expired} Batches</p>
                    <p className="text-xs text-rose-700 mt-0.5">Passed safe shelf life before pickup</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Food Categories & User Ecosystem Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-emerald-600" />
                    Surplus Rescued by Food Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {foodCategories.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No categorized donations recorded yet.</p>
                  ) : (
                    foodCategories.map((cat: any) => (
                      <div key={cat.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800">{cat.category}</span>
                          <span className="text-slate-500">
                            {cat.servings} Servings ({cat.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(cat.percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Active Participants Distribution */}
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Platform Ecosystem Participation
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                      <span className="text-xs font-semibold text-emerald-800">Donors</span>
                      <p className="text-xl font-bold text-emerald-950 mt-0.5">{userDistribution.donors}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                      <span className="text-xs font-semibold text-purple-800">NGOs</span>
                      <p className="text-xl font-bold text-purple-950 mt-0.5">{userDistribution.ngos}</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                      <span className="text-xs font-semibold text-amber-800">Volunteers</span>
                      <p className="text-xl font-bold text-amber-950 mt-0.5">{userDistribution.volunteers}</p>
                    </div>
                  </div>

                  {/* Volunteer Fleet Breakdown */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Bike className="w-3.5 h-3.5 text-amber-600" />
                      Courier Vehicle Fleet Modes
                    </h4>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {vehicles.map((v: any) => (
                        <div key={v.vehicle} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="font-bold text-slate-900">{v.vehicle}:</span>{" "}
                          <span className="text-slate-600">{v.count} Couriers</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Donors & Recipient NGOs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Donors */}
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Top Food Rescuing Donors
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {topDonors.length === 0 ? (
                    <p className="p-6 text-xs text-slate-500 italic">No donor records recorded yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {topDonors.map((d: any, idx: number) => (
                        <div key={d.organization_name || idx} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{d.organization_name}</p>
                              <p className="text-slate-500">{d.donation_count} batches submitted</p>
                            </div>
                          </div>
                          <Badge variant="success" size="sm">
                            {d.total_servings} Servings
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Recipient NGOs */}
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Top Food Distributing Shelters
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {topNgos.length === 0 ? (
                    <p className="p-6 text-xs text-slate-500 italic">No NGO intake distributions completed yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {topNgos.map((ngo: any, idx: number) => (
                        <div key={ngo.organization_name || idx} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{ngo.organization_name}</p>
                              <p className="text-slate-500">{ngo.deliveries_received} delivery dropoffs</p>
                            </div>
                          </div>
                          <Badge variant="info" size="sm">
                            {ngo.total_servings} Servings Received
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
