"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { LoadingTable } from "@/components/ui/LoadingState";
import { adminService } from "@/lib/services/admin.service";
import {
  Bike,
  Award,
  CheckCircle2,
  Star,
  ShieldCheck,
  Search,
  Filter,
  RotateCw,
  AlertCircle,
  Power,
  Check,
  X,
  Navigation,
} from "lucide-react";

export default function AdminVolunteersPage() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadVolunteers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getVolunteers({
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        verificationStatus: verificationFilter !== "all" ? verificationFilter : undefined,
      });
      setVolunteers(data);
    } catch (err: any) {
      console.error("Failed to load volunteers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, [search, statusFilter, verificationFilter]);

  const handleToggleActive = async (volunteer: any) => {
    const nextStatus = volunteer.userStatus === "active" ? "suspended" : "active";
    try {
      setActionError(null);
      await adminService.updateVolunteerStatus(volunteer.userId, nextStatus);
      setActionSuccess(`Volunteer "${volunteer.name}" has been ${nextStatus === "active" ? "activated" : "deactivated"}.`);
      setTimeout(() => setActionSuccess(null), 3500);
      await loadVolunteers();
    } catch (err: any) {
      setActionError(err.message || "Failed to update volunteer status.");
    }
  };

  const handleUpdateVerification = async (volunteer: any, nextVerif: "verified" | "rejected") => {
    try {
      setActionError(null);
      await adminService.updateVolunteerVerification(volunteer.userId, nextVerif);
      setActionSuccess(`Volunteer "${volunteer.name}" verification set to ${nextVerif}.`);
      setTimeout(() => setActionSuccess(null), 3500);
      await loadVolunteers();
    } catch (err: any) {
      setActionError(err.message || "Failed to update volunteer verification.");
    }
  };

  const totalDeliveries = volunteers.reduce((acc, v) => acc + (v.completedTrips || 0), 0);
  const totalMealsDelivered = volunteers.reduce((acc, v) => acc + (v.mealsDelivered || 0), 0);

  return (
    <DashboardLayout
      role="admin"
      title="Volunteer Fleet Management & Verification"
      description="Courier performance metrics, food handling clearances, and dispatch availability directly from SQLite."
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={loadVolunteers}
          leftIcon={<RotateCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Registered Fleet</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{volunteers.length} Couriers</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <span className="text-xs font-semibold text-emerald-800 uppercase">Verified Couriers</span>
            <p className="text-2xl font-bold text-emerald-950 mt-1">
              {volunteers.filter((v) => v.verificationStatus === "verified").length} Active
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <span className="text-xs font-semibold text-blue-800 uppercase">Total Completed Pickups</span>
            <p className="text-2xl font-bold text-blue-950 mt-1">{totalDeliveries} Trips</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <span className="text-xs font-semibold text-amber-800 uppercase">Meals Rescued by Fleet</span>
            <p className="text-2xl font-bold text-amber-950 mt-1">{totalMealsDelivered} Portions</p>
          </div>
        </div>

        {/* Action Alerts */}
        {actionError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-600 font-bold hover:underline">
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

        {/* Filter and Search Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-44">
              <Select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Verifications" },
                  { value: "verified", label: "Verified Only" },
                  { value: "pending", label: "Pending Audit" },
                  { value: "rejected", label: "Rejected" },
                ]}
              />
            </div>

            <div className="w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Account Statuses" },
                  { value: "active", label: "🟢 Active" },
                  { value: "suspended", label: "⚪ Deactivated" },
                ]}
              />
            </div>
          </div>

          <div className="w-full sm:w-80">
            <Input
              placeholder="Search courier name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>

        {/* Volunteers Table */}
        {loading ? (
          <LoadingTable rows={5} />
        ) : volunteers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-500">
              <p className="font-semibold text-slate-900">No Volunteer Couriers Found</p>
              <p className="text-xs mt-1">Try adjusting your verification or status filters.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Volunteer Courier</th>
                      <th className="px-6 py-3.5">Vehicle & Radius</th>
                      <th className="px-6 py-3.5">Completed Pickups</th>
                      <th className="px-6 py-3.5">Meals Delivered</th>
                      <th className="px-6 py-3.5">Verification</th>
                      <th className="px-6 py-3.5">Account Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {volunteers.map((v) => {
                      const isActive = v.userStatus === "active";
                      const isVerified = v.verificationStatus === "verified";

                      return (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900 block">{v.name}</span>
                            <span className="text-xs text-slate-400">{v.email} • {v.phone}</span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">{v.address}</span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              {v.vehicleType}
                            </span>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              Radius: {v.preferredRadius} mi
                            </span>
                          </td>

                          <td className="px-6 py-4 font-bold text-emerald-700">
                            {v.completedTrips} Trips
                          </td>

                          <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                            {v.mealsDelivered} Servings
                            <span className="text-slate-400 font-normal block">{v.volunteerPoints} pts</span>
                          </td>

                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                isVerified
                                  ? "success"
                                  : v.verificationStatus === "pending"
                                  ? "warning"
                                  : "danger"
                              }
                              size="sm"
                              dot
                            >
                              {v.verificationStatus}
                            </Badge>
                          </td>

                          <td className="px-6 py-4">
                            <Badge variant={isActive ? "success" : "neutral"} size="sm">
                              {v.userStatus}
                            </Badge>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {!isVerified ? (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  className="text-xs"
                                  onClick={() => handleUpdateVerification(v, "verified")}
                                >
                                  <Check className="w-3.5 h-3.5 mr-1" /> Verify
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                                  onClick={() => handleUpdateVerification(v, "rejected")}
                                >
                                  Revoke
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant={isActive ? "outline" : "primary"}
                                className={`text-xs ${
                                  isActive ? "text-rose-600 border-rose-200 hover:bg-rose-50" : ""
                                }`}
                                onClick={() => handleToggleActive(v)}
                              >
                                {isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
