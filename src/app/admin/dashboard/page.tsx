"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingCards } from "@/components/ui/LoadingState";
import { adminService } from "@/lib/services/admin.service";
import { AdminOverviewStats } from "@/lib/db/repositories/admin.repo";
import {
  ShieldAlert,
  Users,
  Building2,
  Bike,
  PackageCheck,
  AlertTriangle,
  RotateCw,
  ArrowRight,
  CheckCircle2,
  Clock,
  Scale,
  Ban,
  FileText,
  BarChart3,
  Utensils,
  FolderSync,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminOverviewStats>({
    totalUsers: 0,
    activeDonors: 0,
    verifiedNgos: 0,
    activeVolunteers: 0,
    activeDonations: 0,
    completedDonations: 0,
    mealsRescued: 0,
    estimatedShareBitedKg: 0,
    expiredDonations: 0,
    pendingNgos: 0,
    openReports: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getOverviewStats();
      if (data) setStats(data);
    } catch (err: any) {
      console.error("Failed to load admin overview statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <DashboardLayout
      role="admin"
      title="Admin Operations & Governance Hub"
      description="Live platform surveillance, verification auditing, logistics integrity, and impact analytics."
      action={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadStats}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Refresh Data
          </Button>
          {stats.pendingNgos > 0 && (
            <Link href="/admin/ngos">
              <Button size="sm" leftIcon={<ShieldAlert className="w-4 h-4" />}>
                Review {stats.pendingNgos} Pending NGOs
              </Button>
            </Link>
          )}
        </div>
      }
    >
      <div className="space-y-8">
        {/* Compliance Alert Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.pendingNgos > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  NGO Legal Verification Queue
                </span>
                <h3 className="text-sm font-bold text-amber-950">
                  {stats.pendingNgos} Non-Profit Organization Application{stats.pendingNgos > 1 ? "s" : ""} Awaiting Review
                </h3>
                <p className="text-xs text-amber-800">
                  Charities awaiting 501(c)(3) tax exemption & health inspection clearance before food reservation access.
                </p>
              </div>
              <Link href="/admin/ngos">
                <Button size="sm" variant="primary" className="shrink-0">
                  Review Queue
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-950">NGO Verification Queue Clear</h4>
                <p className="text-xs text-emerald-800">All submitted charitable organization documents are vetted.</p>
              </div>
            </div>
          )}

          {stats.openReports > 0 ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                  Quality & Dispute Tickets
                </span>
                <h3 className="text-sm font-bold text-rose-950">
                  {stats.openReports} Active Quality / Safety Issue Report{stats.openReports > 1 ? "s" : ""}
                </h3>
                <p className="text-xs text-rose-800">
                  Participant tickets regarding food quality, late courier arrivals, or listing discrepancies.
                </p>
              </div>
              <Link href="/admin/reports">
                <Button size="sm" variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-100 shrink-0">
                  Investigate
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Incident Ticket Queue Clear</h4>
                <p className="text-xs text-slate-600">No unresolved food safety or participant dispute reports.</p>
              </div>
            </div>
          )}
        </div>

        {/* 9 Required Real-Time Statistics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Platform Real-Time Operational Overview
            </h2>
            <span className="text-xs text-slate-500">Live SQLite Database Records</span>
          </div>

          {loading ? (
            <LoadingCards count={3} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {/* 1. Total users */}
              <StatCard
                label="Total Users"
                value={stats.totalUsers}
                subtext="Registered across all roles"
                variant="blue"
                icon={<Users className="w-5 h-5" />}
              />

              {/* 2. Active donors */}
              <StatCard
                label="Active Donors"
                value={stats.activeDonors}
                subtext="Commercial kitchens & caterers"
                variant="emerald"
                icon={<Utensils className="w-5 h-5" />}
              />

              {/* 3. Verified NGOs */}
              <StatCard
                label="Verified NGOs"
                value={stats.verifiedNgos}
                subtext="Vetted shelters & food pantries"
                variant="emerald"
                icon={<Building2 className="w-5 h-5" />}
              />

              {/* 4. Active volunteers */}
              <StatCard
                label="Active Volunteers"
                value={stats.activeVolunteers}
                subtext="Verified bicycle & car couriers"
                variant="amber"
                icon={<Bike className="w-5 h-5" />}
              />

              {/* 5. Active donations */}
              <StatCard
                label="Active Donations"
                value={stats.activeDonations}
                subtext="In claim or transit pipeline"
                variant="blue"
                icon={<Clock className="w-5 h-5" />}
              />

              {/* 6. Completed donations */}
              <StatCard
                label="Completed Donations"
                value={stats.completedDonations}
                subtext="Safely delivered & verified"
                variant="emerald"
                icon={<PackageCheck className="w-5 h-5" />}
              />

              {/* 7. Meals rescued */}
              <StatCard
                label="Meals Rescued"
                value={stats.mealsRescued.toLocaleString()}
                subtext="Portions delivered to communities"
                variant="emerald"
                icon={<Scale className="w-5 h-5" />}
              />

              {/* 8. Estimated food rescued */}
              <StatCard
                label="Estimated ShareBited"
                value={`${stats.estimatedShareBitedKg.toLocaleString()} kg`}
                subtext="Surplus diverted from waste"
                variant="amber"
                icon={<FolderSync className="w-5 h-5" />}
              />

              {/* 9. Expired donations */}
              <StatCard
                label="Expired Donations"
                value={stats.expiredDonations}
                subtext="Surplus not claimed within window"
                variant="danger"
                icon={<Ban className="w-5 h-5" />}
              />
            </div>
          )}
        </div>

        {/* Real-Time Donation Urgency Pipeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Live Donation Urgency Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Dynamic urgency classification recalculated on-the-fly based on remaining time & perishability
              </p>
            </div>
            <Link
              href="/admin/donations"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Manage Listings <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">Critical Urgency</span>
              <p className="text-2xl font-black text-rose-900 mt-1">
                {stats.urgencyBreakdown?.critical ?? 0}
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">&lt; 1 hour / High perishability</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">High Urgency</span>
              <p className="text-2xl font-black text-amber-900 mt-1">
                {stats.urgencyBreakdown?.high ?? 0}
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">1–2 hours remaining</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">Medium Urgency</span>
              <p className="text-2xl font-black text-blue-900 mt-1">
                {stats.urgencyBreakdown?.medium ?? 0}
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">2–4 hours remaining</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Low Urgency</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">
                {stats.urgencyBreakdown?.low ?? 0}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">&gt; 4 hours remaining</p>
            </div>
          </div>
        </div>

        {/* Administration Navigation Hub */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Administrative Governance Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/users" className="group">
              <Card className="hover:border-emerald-300 transition-all shadow-xs h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1">
                      User Management <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Search, role filtering, soft activation/deactivation, and complete user history profiles.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/ngos" className="group">
              <Card className="hover:border-emerald-300 transition-all shadow-xs h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1">
                      NGO Verification <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Review pending charitable charters, approve, reject, or suspend organization food claims.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/donations" className="group">
              <Card className="hover:border-emerald-300 transition-all shadow-xs h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1">
                      Donation Audit & Moderation <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Inspect listings across all statuses and cancel fraudulent or inappropriate surplus submissions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/volunteers" className="group">
              <Card className="hover:border-emerald-300 transition-all shadow-xs h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1">
                      Volunteer Fleet Control <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Verify courier credentials, monitor completed rescues, and activate or pause fleet access.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/reports" className="group">
              <Card className="hover:border-emerald-300 transition-all shadow-xs h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1">
                      Incident & Safety Reports <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Investigate food safety alerts, incorrect portions, fake organizations, or courier disputes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/analytics" className="group">
              <Card className="hover:border-emerald-300 transition-all shadow-xs h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1">
                      Impact Analytics & Charts <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Visual breakdown of categories, completed vs expired ratios, and top performing participants.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
