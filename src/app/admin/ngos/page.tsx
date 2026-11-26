"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingCards } from "@/components/ui/LoadingState";
import { adminService } from "@/lib/services/admin.service";
import {
  Building2,
  ShieldCheck,
  Check,
  X,
  FileText,
  Clock,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Ban,
  Filter,
} from "lucide-react";

export default function AdminNGOsPage() {
  const [ngos, setNgos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadNgos = async () => {
    try {
      setLoading(true);
      const data = await adminService.getNGOApplications();
      setNgos(data);
    } catch (err: any) {
      console.error("Failed to load NGOs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNgos();
  }, []);

  const handleUpdateStatus = async (
    ngoId: string,
    status: "verified" | "rejected" | "suspended" | "pending"
  ) => {
    try {
      setActionError(null);
      await adminService.updateNgoStatus(ngoId, status);
      setActionSuccess(`Organization status successfully updated to "${status.toUpperCase()}".`);
      setTimeout(() => setActionSuccess(null), 3500);
      await loadNgos();
    } catch (err: any) {
      setActionError(err.message || "Failed to update NGO verification status.");
    }
  };

  const pendingNgos = ngos.filter((n) => n.verificationStatus === "pending");
  const displayedNgos = activeTab === "pending" ? pendingNgos : ngos;

  return (
    <DashboardLayout
      role="admin"
      title="NGO Verification & Regulatory Compliance"
      description="Inspect legal non-profit charters, tax exemption documents, and grant or revoke distribution rights."
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={loadNgos}
          leftIcon={<RotateCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Status Counts Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <span className="text-xs font-semibold text-amber-800 uppercase">Pending Applications</span>
            <p className="text-2xl font-bold text-amber-950 mt-1">{pendingNgos.length} Awaiting Audit</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <span className="text-xs font-semibold text-emerald-800 uppercase">Verified Charities</span>
            <p className="text-2xl font-bold text-emerald-950 mt-1">
              {ngos.filter((n) => n.verificationStatus === "verified").length} Active in Network
            </p>
          </div>
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
            <span className="text-xs font-semibold text-rose-800 uppercase">Suspended Access</span>
            <p className="text-2xl font-bold text-rose-950 mt-1">
              {ngos.filter((n) => n.verificationStatus === "suspended").length} Suspended
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 uppercase">Rejected / Ineligible</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {ngos.filter((n) => n.verificationStatus === "rejected").length} Rejected
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
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

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>Pending NGO Applications</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">{pendingNgos.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            All Registered Organizations ({ngos.length})
          </button>
        </div>

        {/* NGO Application Cards */}
        {loading ? (
          <LoadingCards count={3} />
        ) : displayedNgos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                {activeTab === "pending" ? "No Pending NGO Applications" : "No Organizations Found"}
              </h3>
              <p className="text-xs">
                {activeTab === "pending"
                  ? "All charitable partner applications have been audited and cleared by compliance."
                  : "No NGO organizations found in the database."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayedNgos.map((ngo) => (
              <Card key={ngo.id} className="border-slate-200 hover:shadow-xs transition-shadow">
                <CardContent className="p-6 space-y-4">
                  {/* Header Row */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{ngo.name}</h3>
                          <Badge
                            variant={
                              ngo.verificationStatus === "verified"
                                ? "success"
                                : ngo.verificationStatus === "pending"
                                ? "warning"
                                : ngo.verificationStatus === "suspended"
                                ? "danger"
                                : "neutral"
                            }
                            size="sm"
                            dot
                          >
                            {ngo.verificationStatus}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Registration: <strong className="text-slate-800">{ngo.registrationNumber}</strong> • Contact Person: {ngo.contactPerson} ({ngo.phone || ngo.email})
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {ngo.verificationStatus === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => handleUpdateStatus(ngo.id, "verified")}
                          >
                            Verify & Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<X className="w-3.5 h-3.5" />}
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() => handleUpdateStatus(ngo.id, "rejected")}
                          >
                            Reject Application
                          </Button>
                        </>
                      )}

                      {ngo.verificationStatus === "verified" && (
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Ban className="w-3.5 h-3.5" />}
                          className="text-amber-700 border-amber-300 hover:bg-amber-50"
                          onClick={() => handleUpdateStatus(ngo.id, "suspended")}
                        >
                          Suspend Access
                        </Button>
                      )}

                      {ngo.verificationStatus === "suspended" && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleUpdateStatus(ngo.id, "verified")}
                        >
                          Reactivate Organization
                        </Button>
                      )}

                      {ngo.verificationStatus === "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(ngo.id, "verified")}
                        >
                          Reconsider & Verify
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Submitted Information Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-900 block">Facility & Capacity</span>
                      <p className="text-slate-500 mt-0.5">{ngo.address}</p>
                      <p className="text-emerald-700 font-bold mt-1">
                        Capacity: {ngo.capacityPerDay} meals/day (Current need: {ngo.currentRequirement})
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-900 block">Food Categories Accepted</span>
                      <p className="text-slate-500 mt-0.5">{ngo.foodPreferences?.join(", ") || "Standard Meals"}</p>
                      <p className="text-slate-500 mt-1">Operating Hours: {ngo.operationalHours}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-900 block">Audited Documentation</span>
                      <div className="flex flex-col gap-1 mt-1">
                        {(ngo.documentsSubmitted || ["501c3_Tax_Exemption.pdf"]).map((doc: string) => (
                          <span
                            key={doc}
                            className="flex items-center gap-1 text-slate-700 font-medium hover:underline cursor-pointer"
                            onClick={() => alert(`Reviewing document: ${doc} for ${ngo.name}`)}
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {ngo.description && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      "{ngo.description}"
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
