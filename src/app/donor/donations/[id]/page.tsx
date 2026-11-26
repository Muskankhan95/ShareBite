"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingCards } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { donationService } from "@/lib/services/donation.service";
import { DonationItem, DonationStatus } from "@/types/donation";
import { formatDate, formatTimeRemaining } from "@/lib/utils";
import NgoMatchCard from "@/components/matching/NgoMatchCard";
import { NGOMatchResult } from "@/lib/matching/types";
import {
  ArrowLeft,
  Utensils,
  MapPin,
  Clock,
  Building2,
  Bike,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  Play,
  XCircle,
  Bell,
  Layers,
  Sparkles,
  Phone,
  ChevronRight,
} from "lucide-react";

const LIFECYCLE_STAGES: Array<{ status: DonationStatus; label: string; desc: string }> = [
  { status: "draft", label: "Draft", desc: "Saved privately" },
  { status: "published", label: "Published", desc: "Awaiting NGO match" },
  { status: "matched", label: "Matched", desc: "NGO matched" },
  { status: "accepted", label: "Accepted", desc: "NGO confirmed" },
  { status: "pickup_assigned", label: "Pickup Assigned", desc: "Volunteer en route" },
  { status: "picked_up", label: "Picked Up", desc: "Food in transit" },
  { status: "delivered", label: "Delivered", desc: "Arrived at NGO" },
  { status: "completed", label: "Completed", desc: "Impact verified" },
];

export default function DonationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const donationId = params?.id as string;

  const [donation, setDonation] = useState<DonationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [ngoMatches, setNgoMatches] = useState<NGOMatchResult[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [connectingNgoId, setConnectingNgoId] = useState<string | null>(null);

  const loadItem = async () => {
    try {
      const item = await donationService.getDonationById(donationId);
      setDonation(item);

      // Fetch donor notifications to show real dispatch audit
      try {
        const notifRes = await fetch("/api/notifications");
        if (notifRes.ok) {
          const data = await notifRes.json();
          const related = (data.notifications || []).filter(
            (n: any) => n.message?.toLowerCase().includes(item?.title.toLowerCase() || "")
          );
          setNotifications(related);
        }
      } catch {
        // notification fetch non-fatal
      }

      // Fetch smart NGO matching recommendations
      try {
        setMatchesLoading(true);
        const matchRes = await fetch(`/api/matching/ngos?donationId=${donationId}`);
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          setNgoMatches(matchData.matches || []);
        }
      } catch {
        // match fetch non-fatal
      } finally {
        setMatchesLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnectNgo = async (match: NGOMatchResult) => {
    try {
      setConnectingNgoId(match.ngoId);
      setActionMessage(null);
      const updated = await donationService.advanceLifecycle(donationId, "matched");
      if (updated) setDonation(updated);
      setActionMessage(`Successfully connected with ${match.organizationName} (${match.matchScore}% Match)!`);
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      setActionMessage(`Connection failed: ${err.message}`);
    } finally {
      setConnectingNgoId(null);
    }
  };

  useEffect(() => {
    if (donationId) loadItem();
  }, [donationId]);

  if (loading) {
    return (
      <DashboardLayout role="donor" title="Donation Details">
        <LoadingCards count={1} />
      </DashboardLayout>
    );
  }

  if (!donation) {
    return (
      <DashboardLayout role="donor" title="Donation Not Found">
        <ErrorState
          title="Donation Not Found"
          message={`We could not locate donation record "${donationId}". It may have expired or been removed.`}
          onRetry={() => router.push("/donor/my-donations")}
        />
      </DashboardLayout>
    );
  }

  const { text: timeRemaining, isUrgent } = formatTimeRemaining(donation.expiresAt);

  // Determine active step index in lifecycle
  const currentStatus = donation.status.toLowerCase();
  const isCancelled = currentStatus === "cancelled";
  const isExpired = currentStatus === "expired";

  const getStageIndex = (status: string) => {
    if (status === "available") return 1; // published
    if (status === "in_transit") return 5; // picked_up
    return LIFECYCLE_STAGES.findIndex((s) => s.status === status);
  };

  const currentStageIndex = getStageIndex(currentStatus);

  const handleAdvanceLifecycle = async () => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const updated = await donationService.advanceLifecycle(donation.id, "advance");
      if (updated) {
        setDonation(updated);
        setActionMessage(`Status advanced to "${updated.status.replace("_", " ")}"!`);
        loadItem();
      }
    } catch (err: any) {
      setActionMessage(err.message || "Could not advance lifecycle.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this donation listing?")) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const updated = await donationService.advanceLifecycle(donation.id, "cancel");
      if (updated) {
        setDonation(updated);
        setActionMessage("Donation has been cancelled.");
        loadItem();
      }
    } catch (err: any) {
      setActionMessage(err.message || "Failed to cancel donation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishDraft = async () => {
    setActionLoading(true);
    try {
      const updated = await donationService.advanceLifecycle(donation.id, "published");
      if (updated) {
        setDonation(updated);
        setActionMessage("Donation published to verified NGOs!");
        loadItem();
      }
    } catch (err: any) {
      setActionMessage(err.message || "Failed to publish draft.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout
      role="donor"
      title={donation.title}
      description={`Listing ID: ${donation.id}`}
      action={
        <Link href="/donor/my-donations">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Listings
          </Button>
        </Link>
      }
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Banner notification for actions */}
        {actionMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-emerald-700 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Cancelled or Expired Alert */}
        {isCancelled && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">This donation listing was cancelled.</p>
              <p className="text-xs text-rose-700">No further NGO matching or volunteer pickups will take place.</p>
            </div>
          </div>
        )}

        {isExpired && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">This donation listing expired.</p>
              <p className="text-xs text-amber-700">The safe food distribution time window has passed.</p>
            </div>
          </div>
        )}

        {/* 1. Complete Donation Lifecycle Stepper */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Donation Lifecycle Progression
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Badge status={donation.status} size="md" />
                <span className="text-xs text-slate-500">
                  Safe window: <strong className={isUrgent ? "text-rose-600" : "text-slate-800"}>{timeRemaining}</strong>
                </span>
              </div>
            </div>

            {/* Lifecycle Quick Simulation / Transition Action Buttons */}
            <div className="flex items-center gap-2">
              {donation.status === "draft" && (
                <Button size="sm" onClick={handlePublishDraft} isLoading={actionLoading} leftIcon={<Play className="w-3.5 h-3.5" />}>
                  Publish Listing
                </Button>
              )}

              {!["picked_up", "delivered", "completed", "cancelled", "expired"].includes(donation.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  isLoading={actionLoading}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
                >
                  Cancel Donation
                </Button>
              )}

              {!["completed", "cancelled", "expired"].includes(donation.status) && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAdvanceLifecycle}
                  isLoading={actionLoading}
                  leftIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  className="text-xs font-semibold"
                >
                  Advance Lifecycle
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {LIFECYCLE_STAGES.map((stage, idx) => {
                const isPassed = !isCancelled && !isExpired && currentStageIndex >= idx;
                const isCurrent = !isCancelled && !isExpired && currentStageIndex === idx;

                return (
                  <div
                    key={stage.status}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? "bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs"
                        : isPassed
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                        isCurrent
                          ? "bg-emerald-600 text-white animate-pulse"
                          : isPassed
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isPassed ? "✓" : idx + 1}
                    </div>
                    <p className={`text-xs font-bold leading-tight ${isCurrent ? "text-emerald-900" : isPassed ? "text-slate-900" : "text-slate-500"}`}>
                      {stage.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{stage.desc}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 2. Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Food Details & Specifications */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 sm:p-7 space-y-6">
                {/* Food Image Banner */}
                {donation.imageUrl && (
                  <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={donation.imageUrl}
                      alt={donation.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{donation.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Listed on {formatDate(donation.createdAt)} • Category: <strong className="text-slate-800">{donation.foodType}</strong>
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed mt-3">
                    {donation.description || "Fresh surplus edible food provided for charitable meal distribution."}
                  </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Quantity</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {donation.quantity} {donation.unit || "servings"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Portions</span>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">
                      {donation.servingsEstimate} Servings
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Prepared At</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {donation.preparationTime ? formatDate(donation.preparationTime) : "Just prepared"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Available Until</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {formatDate(donation.expiresAt)}
                    </p>
                  </div>
                </div>

                {/* Storage & Allergens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block mb-1">Storage Method</span>
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 font-medium border border-blue-100">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {donation.storageMethod || "Room Temperature"}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-800 block mb-1">Declared Allergens</span>
                    {donation.dietaryInfo && donation.dietaryInfo.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {donation.dietaryInfo.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs font-medium bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">None declared</span>
                    )}
                  </div>
                </div>

                {/* Food Safety Certification Badge */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Donor Food Safety Checklist Certified</span>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      The donor certified accuracy of all portions, wholesome condition for charity, proper storage conditions, and open disclosure of known allergens.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Matching Engine Recommendations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Smart Donation Matching Engine
                    </h3>
                    <p className="text-xs text-slate-500">
                      Transparent recommendations ranked by distance, capacity, urgency & preference
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active Algorithm (0–100 Scale)
                </span>
              </div>

              {matchesLoading ? (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  Calculating transparent NGO compatibility scores...
                </div>
              ) : ngoMatches.length > 0 ? (
                <div className="space-y-3">
                  {ngoMatches.slice(0, 3).map((match) => (
                    <NgoMatchCard
                      key={match.ngoId}
                      match={match}
                      onSelect={handleConnectNgo}
                      isActionLoading={connectingNgoId === match.ngoId}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  No suitable NGOs available in operational radius.
                </div>
              )}
            </div>

            {/* Notification Audit Log for This Donation */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Dispatched Donor Alerts & Notifications
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-3"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{notif.title}</p>
                          <p className="text-slate-600 mt-0.5">{notif.message}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-3">
                    Notifications are sent automatically as NGOs match and volunteer couriers claim this listing.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Stakeholders & Logistics */}
          <div className="space-y-6">
            {/* Matched NGO Partner */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" /> Matched NGO Recipient
                </h3>

                {donation.claimedByNgoName ? (
                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2">
                    <p className="font-bold text-slate-900 text-sm">{donation.claimedByNgoName}</p>
                    <p className="text-xs text-slate-600 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{donation.claimedNgoAddress || "782 Mission Blvd, San Francisco, CA"}</span>
                    </p>
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                      ✓ Verified Non-Profit Partner
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    Awaiting claim from verified NGOs in your service radius.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Volunteer Courier */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Bike className="w-4 h-4 text-amber-600" /> Volunteer Courier
                </h3>

                {donation.assignedVolunteerName ? (
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 space-y-2">
                    <p className="font-bold text-slate-900 text-sm">{donation.assignedVolunteerName}</p>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{donation.assignedVolunteerPhone || "+1 (555) 456-7890"}</span>
                    </p>
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                      ✓ Verified Volunteer Courier
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    Volunteer dispatch occurs automatically once NGO confirms reception capacity.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pickup Location & Handover */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Pickup Logistics
                </h3>

                <div className="text-xs text-slate-700 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p className="font-semibold text-slate-900">{donation.pickupAddress.street}</p>
                  <p className="text-slate-600">
                    {donation.pickupAddress.city}, {donation.pickupAddress.state} {donation.pickupAddress.zipCode}
                  </p>
                  {donation.specialInstructions && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-slate-600">
                      <strong className="text-slate-900">Instructions:</strong> {donation.specialInstructions}
                    </div>
                  )}
                </div>

                {/* Digital Verification QR */}
                <div className="pt-2 text-center space-y-2">
                  <div className="w-28 h-28 mx-auto bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center p-2 shadow-2xs">
                    <QrCode className="w-20 h-20 text-slate-900" />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Volunteer scans this code upon pickup to record handover and temperature chain of custody.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
