"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { LoadingCards } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { volunteerService } from "@/lib/services/volunteer.service";
import { PickupTask, PickupStatus } from "@/types/pickup";
import { useAuth } from "@/lib/auth/auth-context";
import RouteMap from "@/components/map/RouteMap";
import VolunteerMatchCard from "@/components/matching/VolunteerMatchCard";
import { VolunteerMatchResult } from "@/lib/matching/types";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Utensils,
  ShieldCheck,
  Thermometer,
  FileText,
  Camera,
  Check,
  Award,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";

const LIFECYCLE_STAGES: { status: PickupStatus; label: string; desc: string }[] = [
  { status: "available", label: "Available", desc: "Open for claim" },
  { status: "accepted", label: "Accepted", desc: "Volunteer assigned" },
  { status: "at_pickup", label: "At Pickup", desc: "Arrived at donor" },
  { status: "picked_up", label: "Food Picked Up", desc: "Verified & collected" },
  { status: "in_transit", label: "In Transit", desc: "En route to shelter" },
  { status: "delivered", label: "Delivered", desc: "Handed over to NGO" },
  { status: "completed", label: "Completed", desc: "Mission fulfilled" },
];

function getStageIndex(status: PickupStatus): number {
  switch (status) {
    case "available":
    case "pending":
      return 0;
    case "accepted":
    case "assigned":
      return 1;
    case "at_pickup":
      return 2;
    case "picked_up":
      return 3;
    case "in_transit":
      return 4;
    case "delivered":
      return 5;
    case "completed":
      return 6;
    default:
      return 1;
  }
}

export default function PickupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || "usr_vol_1";
  const pickupId = params?.id as string;

  const [pickup, setPickup] = useState<PickupTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pickup Verification Form State
  const [pickupInspected, setPickupInspected] = useState(false);
  const [pickupTemp, setPickupTemp] = useState<string>("");
  const [pickupNotes, setPickupNotes] = useState<string>("");
  const [pickupPhoto, setPickupPhoto] = useState<string>("");

  // Delivery Verification Form State
  const [deliveryInspected, setDeliveryInspected] = useState(false);
  const [recipientName, setRecipientName] = useState<string>("");
  const [deliveryNotes, setDeliveryNotes] = useState<string>("");
  const [digitalSignature, setDigitalSignature] = useState<string>("");
  const [deliveryPhoto, setDeliveryPhoto] = useState<string>("");

  const [volunteerMatches, setVolunteerMatches] = useState<VolunteerMatchResult[]>([]);
  const [fetchingMatches, setFetchingMatches] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      const item = await volunteerService.getPickupById(pickupId);
      setPickup(item);
      if (item) {
        if (item.pickupVerificationNotes) setPickupNotes(item.pickupVerificationNotes);
        if (item.pickupTempC) setPickupTemp(item.pickupTempC.toString());
        if (item.deliveryRecipientName) setRecipientName(item.deliveryRecipientName);
        if (item.deliveryVerificationNotes) setDeliveryNotes(item.deliveryVerificationNotes);
      }

      // Fetch smart volunteer courier matches if mission is available or unassigned
      try {
        setFetchingMatches(true);
        const matchRes = await fetch(`/api/matching/volunteers?pickupId=${encodeURIComponent(pickupId)}`);
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          setVolunteerMatches(matchData.matches || []);
        }
      } catch {
        // match fetch non-fatal
      } finally {
        setFetchingMatches(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load mission details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignVolunteer = async (volunteerProfileId: string) => {
    try {
      setAssigningId(volunteerProfileId);
      setErrorMsg(null);
      const res = await fetch("/api/matching/assign-volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupId, volunteerProfileId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign courier");
      }
      setSuccessMsg(data.message || "Courier successfully dispatched!");
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchDetails();
    } catch (err: any) {
      setErrorMsg(err.message || "Courier assignment failed");
    } finally {
      setAssigningId(null);
    }
  };

  useEffect(() => {
    if (pickupId) fetchDetails();
  }, [pickupId]);

  if (loading) {
    return (
      <DashboardLayout role="volunteer" title="Loading Mission...">
        <LoadingCards count={1} />
      </DashboardLayout>
    );
  }

  if (!pickup) {
    return (
      <DashboardLayout role="volunteer" title="Mission Not Found">
        <ErrorState
          title="Pickup Mission Not Found"
          message={`Could not find pickup task with ID "${pickupId}". It may have already been completed or reassigned.`}
          onRetry={() => router.push("/volunteer/my-pickups")}
        />
      </DashboardLayout>
    );
  }

  const currentStageIndex = getStageIndex(pickup.status);

  // Status transitions
  const handleUpdateStatus = async (
    targetStatus: PickupStatus,
    extraData?: {
      verificationNotes?: string;
      tempC?: number;
      photoUrl?: string;
      recipientName?: string;
      digitalSignature?: string;
    }
  ) => {
    try {
      setUpdating(true);
      setErrorMsg(null);

      const res = await volunteerService.updatePickupStatus(
        pickup.id,
        targetStatus,
        userId,
        extraData
      );

      setSuccessMsg(res.message || `Status successfully changed to ${targetStatus.replace("_", " ")}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchDetails();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update mission status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleClaim = async () => {
    try {
      setUpdating(true);
      setErrorMsg(null);
      const res = await volunteerService.claimPickup(pickup.id, userId);
      setSuccessMsg(res.message || "Pickup accepted! Safe travels.");
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchDetails();
    } catch (err: any) {
      setErrorMsg(err.message || "Could not claim pickup.");
    } finally {
      setUpdating(false);
    }
  };

  const submitPickupVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupInspected) {
      setErrorMsg("Please verify and check the food inspection box before confirming pickup.");
      return;
    }
    await handleUpdateStatus("picked_up", {
      verificationNotes: pickupNotes || "Inspected containers and packaging integrity.",
      tempC: pickupTemp ? parseFloat(pickupTemp) : undefined,
      photoUrl: pickupPhoto || undefined,
    });
  };

  const submitDeliveryVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryInspected) {
      setErrorMsg("Please check the handover confirmation box before completing delivery.");
      return;
    }
    await handleUpdateStatus("delivered", {
      verificationNotes: deliveryNotes || "Food safely handed over to NGO intake staff.",
      recipientName: recipientName || `${pickup.ngoName} Intake Desk`,
      digitalSignature: digitalSignature || `SIG_${user?.name || "VOLUNTEER"}_${Date.now()}`,
      photoUrl: deliveryPhoto || undefined,
    });
  };

  return (
    <DashboardLayout
      role="volunteer"
      title={`Mission: ${pickup.foodTitle}`}
      description={`Trip: ~${pickup.distanceMiles || pickup.distanceKm} mi • Portions: ${pickup.servings} • Urgency: ${pickup.urgency.toUpperCase()}`}
      action={
        <div className="flex items-center gap-2">
          <Link href="/volunteer/my-pickups">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Pickups
            </Button>
          </Link>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-600 font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 7-Stage Pickup Lifecycle Stepper */}
        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pickup Lifecycle
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Current Status: <span className="text-emerald-700 capitalize">{pickup.status.replace("_", " ")}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={pickup.status} size="md" />
                <Badge variant={pickup.urgency === "critical" ? "danger" : pickup.urgency === "high" ? "warning" : "neutral"} size="sm">
                  {pickup.urgency} urgency
                </Badge>
              </div>
            </div>

            {/* Stepper Dots */}
            <div className="pt-6 pb-2">
              <div className="relative flex items-center justify-between">
                {/* Background Connecting Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0" />
                {/* Active Progress Bar */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-300 z-0"
                  style={{
                    width: `${(currentStageIndex / (LIFECYCLE_STAGES.length - 1)) * 100}%`,
                  }}
                />

                {LIFECYCLE_STAGES.map((stg, idx) => {
                  const isDone = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;

                  return (
                    <div key={stg.status} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isDone
                            ? "bg-emerald-600 text-white shadow-xs"
                            : isCurrent
                            ? "bg-emerald-500 text-white ring-4 ring-emerald-100 shadow-sm"
                            : "bg-white text-slate-400 border-2 border-slate-200"
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[11px] font-semibold mt-2 hidden sm:block ${
                          isCurrent ? "text-emerald-800 font-bold" : isDone ? "text-slate-700" : "text-slate-400"
                        }`}
                      >
                        {stg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Button Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Advance the mission as you physically arrive at the donor and deliver to the NGO.
              </p>

              <div className="flex items-center gap-2">
                {(pickup.status === "available" || pickup.status === "pending") && (
                  <Button
                    variant="primary"
                    onClick={handleClaim}
                    isLoading={updating}
                  >
                    Accept This Rescue Mission
                  </Button>
                )}

                {(pickup.status === "accepted" || pickup.status === "assigned") && (
                  <Button
                    variant="primary"
                    onClick={() => handleUpdateStatus("at_pickup")}
                    isLoading={updating}
                  >
                    Mark "At Pickup Location"
                  </Button>
                )}

                {pickup.status === "picked_up" && (
                  <Button
                    variant="primary"
                    onClick={() => handleUpdateStatus("in_transit")}
                    isLoading={updating}
                  >
                    Start In-Transit Journey
                  </Button>
                )}

                {pickup.status === "delivered" && (
                  <Button
                    variant="primary"
                    onClick={() => handleUpdateStatus("completed")}
                    isLoading={updating}
                  >
                    Complete & Archive Mission
                  </Button>
                )}

                {pickup.status === "completed" && (
                  <Badge variant="success" size="md">
                    ✓ Mission Completed & Impact Credited
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Volunteer Courier Recommendations (Active when mission is available/unassigned) */}
        {(pickup.status === "available" || pickup.status === "pending") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Smart Volunteer Courier Dispatch Engine
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ranked by proximity to pickup, transport vehicle & current availability (zero multi-dispatch)
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Transparent Matching
              </span>
            </div>

            {fetchingMatches ? (
              <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Scanning available community couriers...
              </div>
            ) : volunteerMatches.length > 0 ? (
              <div className="space-y-3">
                {volunteerMatches.slice(0, 3).map((match) => (
                  <VolunteerMatchCard
                    key={match.volunteerId}
                    match={match}
                    onAssign={handleAssignVolunteer}
                    isAssigning={assigningId === match.volunteerId}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                No active couriers available in this sector.
              </div>
            )}
          </div>
        )}

        {/* Interactive Pickup & Delivery Route Map (Pickup -> Destination NGO) */}
        <RouteMap
          pickupAddress={pickup.pickupAddress}
          pickupLat={pickup.pickupLat || 37.7915}
          pickupLng={pickup.pickupLng || -122.3999}
          dropoffAddress={pickup.dropoffAddress}
          dropoffLat={pickup.dropoffLat || 37.7858}
          dropoffLng={pickup.dropoffLng || -122.4042}
          donorName={pickup.donorName}
          ngoName={pickup.ngoName}
          distanceKm={pickup.distanceKm}
          estimatedDurationMins={pickup.estimatedDurationMins}
        />

        {/* STEP A: Pickup Verification Card (Active when at_pickup) */}
        {(pickup.status === "at_pickup" || currentStageIndex >= 3) && (
          <Card className={pickup.status === "at_pickup" ? "border-amber-300 ring-2 ring-amber-100" : ""}>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Step 1: Food Pickup Verification
                    </h3>
                    <p className="text-xs text-slate-500">Verify food condition at donor facility</p>
                  </div>
                </div>

                {currentStageIndex >= 3 && (
                  <Badge variant="success" size="sm">✓ Picked Up Verified</Badge>
                )}
              </div>

              {/* Donation Details Display */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="font-semibold text-slate-500 block">Food Name</span>
                    <span className="font-bold text-slate-900">{pickup.foodTitle}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Category</span>
                    <span className="font-bold text-slate-900">{pickup.foodType}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Servings & Quantity</span>
                    <span className="font-bold text-slate-900">
                      {pickup.servings} Servings {pickup.quantity ? `(${pickup.quantity} kg)` : ""}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="font-semibold text-slate-500 block">Storage Requirement</span>
                    <span className="text-slate-800">{pickup.storageMethod || "Standard Insulated Handling"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Known Allergens Disclosed</span>
                    <span className="text-slate-800">
                      {pickup.allergens && pickup.allergens.length > 0
                        ? pickup.allergens.join(", ")
                        : "No common allergens reported"}
                    </span>
                  </div>
                </div>

                {pickup.description && (
                  <p className="text-slate-600 text-xs italic bg-white p-2.5 rounded border border-slate-200">
                    "{pickup.description}"
                  </p>
                )}
              </div>

              {/* Pickup Verification Form */}
              {pickup.status === "at_pickup" ? (
                <form onSubmit={submitPickupVerification} className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pickupInspected}
                        onChange={(e) => setPickupInspected(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 mt-0.5 focus:ring-emerald-500"
                        required
                      />
                      <span className="text-xs text-amber-950 font-medium">
                        I confirm that the food containers are securely sealed, intact, and packaged in
                        compliance with safe food handling standards.
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Container Surface Temp (°C) (Optional)"
                      placeholder="e.g. 62°C (warm) or 4°C (chilled)"
                      value={pickupTemp}
                      onChange={(e) => setPickupTemp(e.target.value)}
                    />
                    <Input
                      label="Pickup Photo Proof URL (Optional)"
                      placeholder="https://... or photo proof link"
                      value={pickupPhoto}
                      onChange={(e) => setPickupPhoto(e.target.value)}
                    />
                  </div>

                  <Textarea
                    label="Courier Pickup Notes (Optional)"
                    placeholder="e.g. Stored in insulated thermo-bag; handed over by Chef Marco."
                    rows={2}
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                  />

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={updating}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Confirm Food Picked Up
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-xs text-slate-500 space-y-1">
                  <p>
                    Verified Notes: <strong className="text-slate-700">{pickup.pickupVerificationNotes || "Container seals verified upon collection."}</strong>
                  </p>
                  {pickup.pickupTempC && (
                    <p>
                      Measured Temperature: <strong className="text-slate-700">{pickup.pickupTempC}°C</strong>
                    </p>
                  )}
                  {pickup.pickedUpAt && (
                    <p>
                      Timestamp: <strong className="text-slate-700">{new Date(pickup.pickedUpAt).toLocaleString()}</strong>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP B: Delivery Verification Card (Active when in_transit or delivered) */}
        {(pickup.status === "in_transit" || currentStageIndex >= 5) && (
          <Card className={pickup.status === "in_transit" ? "border-blue-300 ring-2 ring-blue-100" : ""}>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Step 2: Shelter Delivery Handover Verification
                    </h3>
                    <p className="text-xs text-slate-500">Confirm delivery to receiving NGO staff</p>
                  </div>
                </div>

                {currentStageIndex >= 5 && (
                  <Badge variant="success" size="sm">✓ Delivery Verified</Badge>
                )}
              </div>

              {/* NGO Details Display */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="font-semibold text-slate-500 block">Receiving NGO / Shelter</span>
                    <span className="font-bold text-slate-900 text-sm">{pickup.ngoName}</span>
                    <span className="text-slate-600 block mt-0.5">{pickup.dropoffAddress}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Shelter Contact Phone</span>
                    <a
                      href={`tel:${pickup.ngoPhone}`}
                      className="font-bold text-blue-700 hover:underline flex items-center gap-1 mt-1"
                    >
                      <Phone className="w-3.5 h-3.5" /> {pickup.ngoPhone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Delivery Verification Form */}
              {pickup.status === "in_transit" ? (
                <form onSubmit={submitDeliveryVerification} className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deliveryInspected}
                        onChange={(e) => setDeliveryInspected(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 mt-0.5 focus:ring-blue-500"
                        required
                      />
                      <span className="text-xs text-blue-950 font-medium">
                        I confirm that the entire food donation was delivered to the designated NGO
                        facility and received by authorized staff in good condition.
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Receiving Staff Member / Name"
                      placeholder="e.g. Sister Maria or Intake Supervisor"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      required
                    />
                    <Input
                      label="Delivery Confirmation Code / Signature (Optional)"
                      placeholder="e.g. SIG_INTAKE_982"
                      value={digitalSignature}
                      onChange={(e) => setDigitalSignature(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Delivery Handover Photo URL (Optional)"
                      placeholder="https://... or photo proof link"
                      value={deliveryPhoto}
                      onChange={(e) => setDeliveryPhoto(e.target.value)}
                    />
                    <Input
                      label="Handover Notes (Optional)"
                      placeholder="e.g. Placed directly in walk-in refrigerator."
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={updating}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Confirm Delivery Handover
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-xs text-slate-500 space-y-1">
                  <p>
                    Intake Staff: <strong className="text-slate-700">{pickup.deliveryRecipientName || "Authorized Shelter Staff"}</strong>
                  </p>
                  <p>
                    Delivery Notes: <strong className="text-slate-700">{pickup.deliveryVerificationNotes || "Handover completed safely."}</strong>
                  </p>
                  {pickup.deliveredAt && (
                    <p>
                      Timestamp: <strong className="text-slate-700">{new Date(pickup.deliveredAt).toLocaleString()}</strong>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Route Details Waypoints Card */}
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-bold text-slate-900">Route Waypoints & Navigation</h3>

            {/* Step 1: Donor Origin */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Pickup Origin (Donor)
                </span>
                <h4 className="text-base font-bold text-slate-900">{pickup.donorName}</h4>
                <p className="text-xs text-slate-600">{pickup.pickupAddress}</p>
                <div className="pt-2 flex items-center gap-4 text-xs">
                  <span className="text-slate-500">
                    Window: <strong>{pickup.pickupTimeWindow || "Immediate"}</strong>
                  </span>
                  <a
                    href={`tel:${pickup.donorPhone}`}
                    className="text-emerald-700 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Phone className="w-3 h-3" /> Call Donor ({pickup.donorPhone})
                  </a>
                </div>
              </div>
            </div>

            {/* Step 2: Destination NGO */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                  Dropoff Destination (Shelter)
                </span>
                <h4 className="text-base font-bold text-slate-900">{pickup.ngoName}</h4>
                <p className="text-xs text-slate-600">{pickup.dropoffAddress}</p>
                <div className="pt-2 flex items-center gap-4 text-xs">
                  <span className="text-slate-500">
                    Estimated Transit: <strong>~{pickup.estimatedDurationMins} minutes</strong>
                  </span>
                  <a
                    href={`tel:${pickup.ngoPhone}`}
                    className="text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Phone className="w-3 h-3" /> Call Shelter ({pickup.ngoPhone})
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Food Safety & Privacy Guidelines */}
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Volunteer Courier Privacy & Handling Charter
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ShareBite strictly safeguards privacy. Couriers only receive pickup location and intake
              contact info essential for delivery fulfillment. Never share donor contact numbers or
              shelter beneficiary details.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
