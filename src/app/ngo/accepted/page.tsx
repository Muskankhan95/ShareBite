"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCards } from "@/components/ui/LoadingState";
import { ngoService } from "@/lib/services/ngo.service";
import { donationService } from "@/lib/services/donation.service";
import { DonationItem, DonationStatus } from "@/types/donation";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate } from "@/lib/utils";
import {
  MapPin,
  Clock,
  Bike,
  CheckCircle2,
  Phone,
  Utensils,
  Building2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const TRACKING_STEPS = [
  { key: "requested", label: "Requested", desc: "Need submitted" },
  { key: "accepted", label: "Accepted", desc: "Surplus reserved" },
  { key: "pickup_assigned", label: "Volunteer Assigned", desc: "Courier dispatched" },
  { key: "picked_up", label: "Picked Up", desc: "In transit to shelter" },
  { key: "delivered", label: "Delivered", desc: "Arrived at shelter" },
  { key: "completed", label: "Completed", desc: "Verified & distributed" },
];

export default function AcceptedDonationsPage() {
  const { user } = useAuth();
  const [accepted, setAccepted] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadAccepted = async () => {
    try {
      const ngoUserId = user?.id || "usr_ngo_1";
      const items = await ngoService.getAcceptedDonations(ngoUserId);
      setAccepted(items);
    } catch (err) {
      console.error("Failed to load accepted food:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccepted();
  }, [user]);

  const getStepIndex = (status: DonationStatus) => {
    switch (status) {
      case "requested":
        return 0;
      case "matched":
      case "accepted":
        return 1;
      case "pickup_assigned":
        return 2;
      case "in_transit":
      case "picked_up":
        return 3;
      case "delivered":
        return 4;
      case "completed":
        return 5;
      default:
        return 1;
    }
  };

  const handleConfirmReceived = async (donationId: string) => {
    setActionLoadingId(donationId);
    setFeedback(null);
    try {
      await ngoService.confirmDeliveryReceived(donationId);
      setFeedback("Delivery confirmed and marked complete! Thank you for nourishing our community.");
      loadAccepted();
    } catch (err: any) {
      setFeedback(err.message || "Failed to confirm receipt.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAdvanceSimulation = async (donationId: string) => {
    setActionLoadingId(donationId);
    try {
      await donationService.advanceLifecycle(donationId, "advance");
      loadAccepted();
    } catch (err: any) {
      setFeedback(err.message || "Failed to advance state.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <DashboardLayout
      role="ngo"
      title="Inbound Donations Tracking"
      description="Track live inbound surplus food deliveries across all stages from donor kitchen to your shelter intake."
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {feedback && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="font-bold">
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <LoadingCards count={2} />
        ) : accepted.length === 0 ? (
          <EmptyState
            title="No Active Inbound Deliveries"
            description="You do not have any claimed food batches in coordination or transit right now. Check nearby available surplus food to accept donations."
            actionLabel="Find Nearby Surplus Food"
            actionHref="/ngo/nearby"
          />
        ) : (
          <div className="space-y-6">
            {accepted.map((item) => {
              const currentStep = getStepIndex(item.status);

              return (
                <Card key={item.id} className="border-slate-200 overflow-hidden shadow-xs">
                  {/* Top Header */}
                  <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge status={item.status} size="sm" />
                        <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {item.foodType}
                        </span>
                        <span className="text-xs text-slate-400">ID: {item.id}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{item.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    </div>

                    <div className="text-left md:text-right shrink-0">
                      <span className="text-2xl font-extrabold text-emerald-700">
                        {item.servingsEstimate}
                      </span>
                      <span className="text-xs text-slate-500 block">Portions reserved</span>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6">
                    {/* 6-Stage Tracking Stepper (Exact Prompt Requirements) */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                        Live Tracking Stepper
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {TRACKING_STEPS.map((step, idx) => {
                          const isDone = currentStep >= idx;
                          const isCurrent = currentStep === idx;

                          return (
                            <div
                              key={step.key}
                              className={`p-2.5 rounded-xl border text-center transition-all ${
                                isCurrent
                                  ? "bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
                                  : isDone
                                  ? "bg-emerald-50/40 border-emerald-200"
                                  : "bg-slate-50 border-slate-200 opacity-60"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                                  isCurrent
                                    ? "bg-blue-600 text-white animate-pulse"
                                    : isDone
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-200 text-slate-500"
                                }`}
                              >
                                {isDone ? "✓" : idx + 1}
                              </div>
                              <p className={`text-xs font-bold leading-tight ${isCurrent ? "text-blue-900" : isDone ? "text-slate-900" : "text-slate-500"}`}>
                                {step.label}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{step.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Logistics Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      {/* Donor Kitchen */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" /> Donor Source
                        </span>
                        <p className="font-semibold text-slate-800">{item.donorName}</p>
                        <p className="text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {item.pickupAddress.street}
                        </p>
                        {item.donorPhone && (
                          <p className="text-slate-500 flex items-center gap-1 pt-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            {item.donorPhone}
                          </p>
                        )}
                      </div>

                      {/* Volunteer Courier */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                          <Bike className="w-3.5 h-3.5 text-amber-600" /> Assigned Courier
                        </span>
                        <p className="font-semibold text-slate-800">
                          {item.assignedVolunteerName || "Volunteer Dispatching..."}
                        </p>
                        {item.assignedVolunteerPhone ? (
                          <p className="text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {item.assignedVolunteerPhone}
                          </p>
                        ) : (
                          <p className="text-slate-400">Available couriers alerted</p>
                        )}
                        <p className="text-emerald-700 font-medium pt-1">
                          Storage: {item.storageMethod || "Standard Insulated"}
                        </p>
                      </div>

                      {/* Safe Timing */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> Arrival Window
                        </span>
                        <p className="text-slate-700">
                          Available until: <strong>{formatDate(item.expiresAt)}</strong>
                        </p>
                        <p className="text-slate-500">
                          Intake Destination: {user?.address?.street || "782 Mission Blvd"}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Confirm Safe Receipt or Advance Lifecycle */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAdvanceSimulation(item.id)}
                        disabled={actionLoadingId === item.id}
                        className="text-xs text-slate-600"
                        leftIcon={<ChevronRight className="w-3.5 h-3.5" />}
                      >
                        Advance State (Demo)
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        isLoading={actionLoadingId === item.id}
                        onClick={() => handleConfirmReceived(item.id)}
                      >
                        Confirm Delivery Received & Nourished
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
