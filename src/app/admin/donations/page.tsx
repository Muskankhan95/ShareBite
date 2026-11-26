"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { LoadingTable } from "@/components/ui/LoadingState";
import { adminService } from "@/lib/services/admin.service";
import {
  PackageCheck,
  Search,
  Filter,
  RotateCw,
  Eye,
  Ban,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileText,
} from "lucide-react";

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [cancellingDonation, setCancellingDonation] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllDonations({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
      });
      setDonations(data);
    } catch (err: any) {
      console.error("Failed to load donations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, [statusFilter, search]);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingDonation) return;

    try {
      setActionError(null);
      await adminService.cancelDonation(
        cancellingDonation.id,
        cancelReason || "Listing removed due to compliance violation."
      );
      setActionSuccess(`Donation "${cancellingDonation.title}" was cancelled.`);
      setTimeout(() => setActionSuccess(null), 3500);
      setCancellingDonation(null);
      setCancelReason("");
      await loadDonations();
    } catch (err: any) {
      setActionError(err.message || "Failed to cancel donation.");
    }
  };

  return (
    <DashboardLayout
      role="admin"
      title="Platform Food Surplus Listings & Moderation"
      description="Inspect surplus food posts, claim and delivery pipelines, and cancel fraudulent or non-compliant listings."
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={loadDonations}
          leftIcon={<RotateCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
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

        {/* Filter & Search Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="w-56">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "available", label: "Available for claim" },
                { value: "matched", label: "Matched" },
                { value: "accepted", label: "Accepted by NGO" },
                { value: "pickup_assigned", label: "Courier Assigned" },
                { value: "in_transit", label: "In Transit" },
                { value: "delivered", label: "Delivered & Verified" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled Listings" },
                { value: "expired", label: "Expired Listings" },
              ]}
            />
          </div>

          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by title, donor, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingTable rows={6} />
        ) : donations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-500">
              <p className="font-semibold text-slate-900">No Donations Match Query</p>
              <p className="text-xs mt-1">Adjust your status filter or search parameters.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Listing & Food Category</th>
                      <th className="px-6 py-3.5">Donor Facility</th>
                      <th className="px-6 py-3.5">Portions / Qty</th>
                      <th className="px-6 py-3.5">Claimed NGO</th>
                      <th className="px-6 py-3.5">Courier</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {donations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 block">{d.title}</span>
                          <span className="text-[11px] font-semibold text-emerald-700 uppercase">
                            {d.foodType}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs font-medium text-slate-800">
                          {d.donorName}
                          <span className="block text-[11px] text-slate-400 truncate max-w-xs">{d.pickupAddress}</span>
                        </td>

                        <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                          {d.servingsEstimate} Servings
                          {d.quantity ? <span className="text-slate-400 font-normal"> ({d.quantity} kg)</span> : ""}
                        </td>

                        <td className="px-6 py-4 text-xs font-medium text-blue-800">
                          {d.claimedByNGO || <span className="text-slate-400 font-normal">Unclaimed</span>}
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-600">
                          {d.courierName || <span className="text-slate-400">None</span>}
                        </td>

                        <td className="px-6 py-4">
                          <Badge status={d.status} size="sm" />
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs"
                              onClick={() => setSelectedDonation(d)}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Button>

                            {d.status !== "cancelled" && d.status !== "completed" && d.status !== "delivered" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                                onClick={() => {
                                  setCancellingDonation(d);
                                  setCancelReason("");
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Donation Details Modal */}
        {selectedDonation && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      {selectedDonation.foodType}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedDonation.title}</h3>
                    <p className="text-xs text-slate-500">ID: {selectedDonation.id}</p>
                  </div>
                  <button onClick={() => setSelectedDonation(null)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-500 block">Status</span>
                    <Badge status={selectedDonation.status} size="sm" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Portions / Servings</span>
                    <span className="font-bold text-slate-900">{selectedDonation.servingsEstimate} Servings</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Food Weight</span>
                    <span className="font-bold text-slate-900">{selectedDonation.quantity} kg</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Storage Method</span>
                    <span className="text-slate-800">{selectedDonation.storageMethod || "Standard"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Allergens Disclosed</span>
                    <span className="text-slate-800">
                      {selectedDonation.allergens?.length > 0 ? selectedDonation.allergens.join(", ") : "None reported"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Expires / Available Until</span>
                    <span className="text-slate-800">{new Date(selectedDonation.availableUntil).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900">Pickup Origin & Contact</h4>
                  <p className="text-slate-700"><strong>Donor:</strong> {selectedDonation.donorName}</p>
                  <p className="text-slate-600"><strong>Address:</strong> {selectedDonation.pickupAddress}</p>
                  <p className="text-slate-600"><strong>Contact Phone:</strong> {selectedDonation.donorPhone}</p>
                </div>

                {selectedDonation.claimedByNGO && (
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-xs">
                    <h4 className="font-bold text-blue-900">Receiving NGO</h4>
                    <p className="text-blue-800">Claimed by: {selectedDonation.claimedByNGO}</p>
                    {selectedDonation.courierName && <p className="text-blue-700">Assigned Volunteer: {selectedDonation.courierName}</p>}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Link href={`/admin/reports`}>
                    <Button variant="outline" size="sm" leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}>
                      Check Incident Reports
                    </Button>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setSelectedDonation(null)}>
                      Close
                    </Button>
                    {selectedDonation.status !== "cancelled" && selectedDonation.status !== "completed" && (
                      <Button
                        variant="primary"
                        className="bg-rose-600 hover:bg-rose-700"
                        onClick={() => {
                          setCancellingDonation(selectedDonation);
                          setSelectedDonation(null);
                        }}
                      >
                        Cancel Listing
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cancellation Reason Modal */}
        {cancellingDonation && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-white shadow-xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Ban className="w-5 h-5 text-rose-600" />
                    Cancel Food Listing
                  </h3>
                  <button onClick={() => setCancellingDonation(null)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-600">
                  You are cancelling <strong>"{cancellingDonation.title}"</strong> from donor{" "}
                  <strong>{cancellingDonation.donorName}</strong>. This removes the listing from the dispatch queue.
                </p>

                <form onSubmit={handleCancelSubmit} className="space-y-4">
                  <Textarea
                    label="Administrative Cancellation Reason"
                    placeholder="e.g. Inappropriate packaging, food safety violation, or requested cancellation."
                    required
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" type="button" onClick={() => setCancellingDonation(null)}>
                      Abort
                    </Button>
                    <Button type="submit" variant="primary" className="bg-rose-600 hover:bg-rose-700">
                      Confirm Cancellation
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
