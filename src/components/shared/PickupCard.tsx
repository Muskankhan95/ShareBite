import React, { useState } from "react";
import Link from "next/link";
import { PickupTask, PickupStatus } from "@/types/pickup";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MapPin, Navigation, Clock, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

interface PickupCardProps {
  pickup: PickupTask;
  onClaim?: (pickupId: string) => Promise<void> | void;
  onUpdateStatus?: (pickupId: string, status: PickupStatus) => Promise<void> | void;
  isVolunteerAssigned?: boolean;
}

export const PickupCard: React.FC<PickupCardProps> = ({
  pickup,
  onClaim,
  onUpdateStatus,
  isVolunteerAssigned = false,
}) => {
  const [submitting, setSubmitting] = useState(false);

  const handleClaim = async () => {
    if (!onClaim) return;
    try {
      setSubmitting(true);
      await onClaim(pickup.id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (targetStatus: PickupStatus) => {
    if (!onUpdateStatus) return;
    try {
      setSubmitting(true);
      await onUpdateStatus(pickup.id, targetStatus);
    } finally {
      setSubmitting(false);
    }
  };

  const isClaimable =
    !isVolunteerAssigned &&
    (pickup.status === "available" ||
      pickup.status === "pending" ||
      (pickup.status as any) === "unassigned");

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <Badge status={pickup.status} />
          <div className="flex items-center gap-1.5">
            {pickup.timeRemaining && (
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3 text-slate-400" />
                {pickup.timeRemaining}
              </span>
            )}
            <Badge
              variant={
                pickup.urgency === "critical"
                  ? "danger"
                  : pickup.urgency === "high"
                  ? "warning"
                  : "neutral"
              }
              size="sm"
            >
              {pickup.urgency} urgency
            </Badge>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            {pickup.foodType}
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-0.5 line-clamp-1">
            {pickup.foodTitle}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {pickup.servings} Portions {pickup.quantity ? `• ${pickup.quantity} kg` : ""} • ~{pickup.distanceKm ?? Number(((pickup.distanceMiles || 2.4) * 1.6).toFixed(1))} km (~{pickup.distanceMiles || 2.4} mi) • ~{pickup.estimatedDurationMins} min
          </p>
        </div>

        {/* Route Details */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 ring-4 ring-emerald-50" />
            <div className="overflow-hidden">
              <span className="font-semibold text-slate-800 block truncate">
                Pickup: {pickup.donorName}
              </span>
              <span className="text-slate-500 truncate block text-[11px]">
                {pickup.pickupAddress}
              </span>
            </div>
          </div>

          <div className="border-l-2 border-dashed border-slate-300 ml-1.5 h-2.5" />

          <div className="flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0 ring-4 ring-blue-50" />
            <div className="overflow-hidden">
              <span className="font-semibold text-slate-800 block truncate">
                Deliver: {pickup.ngoName}
              </span>
              <span className="text-slate-500 truncate block text-[11px]">
                {pickup.dropoffAddress}
              </span>
            </div>
          </div>
        </div>

        {pickup.notes && (
          <p className="text-xs text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60 flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>{pickup.notes}</span>
          </p>
        )}
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          href={`/volunteer/pickups/${pickup.id}`}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
        >
          <span>View Mission</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {isClaimable && onClaim && (
          <Button
            size="sm"
            variant="primary"
            onClick={handleClaim}
            isLoading={submitting}
          >
            Accept Pickup
          </Button>
        )}

        {isVolunteerAssigned && (pickup.status === "accepted" || pickup.status === "assigned") && onUpdateStatus && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleStatusChange("at_pickup")}
            isLoading={submitting}
          >
            Arrived at Donor
          </Button>
        )}

        {isVolunteerAssigned && pickup.status === "at_pickup" && onUpdateStatus && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleStatusChange("picked_up")}
            isLoading={submitting}
          >
            Confirm Picked Up
          </Button>
        )}

        {isVolunteerAssigned && pickup.status === "picked_up" && onUpdateStatus && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleStatusChange("in_transit")}
            isLoading={submitting}
          >
            Start Transit
          </Button>
        )}

        {isVolunteerAssigned && pickup.status === "in_transit" && onUpdateStatus && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleStatusChange("delivered")}
            isLoading={submitting}
          >
            Confirm Handover
          </Button>
        )}

        {isVolunteerAssigned && pickup.status === "delivered" && onUpdateStatus && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange("completed")}
            isLoading={submitting}
          >
            Finish Mission
          </Button>
        )}

        {pickup.status === "completed" && (
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Done
          </span>
        )}
      </div>
    </div>
  );
};
