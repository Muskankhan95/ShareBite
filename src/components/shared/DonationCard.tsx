import React from "react";
import Link from "next/link";
import { DonationItem } from "@/types/donation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatTimeRemaining } from "@/lib/utils";
import { MapPin, Clock, Utensils, AlertCircle, ArrowRight } from "lucide-react";

interface DonationCardProps {
  donation: DonationItem;
  viewMode?: "donor" | "ngo" | "admin";
  onAction?: (donation: DonationItem) => void;
  actionLabel?: string;
}

export const DonationCard: React.FC<DonationCardProps> = ({
  donation,
  viewMode = "donor",
  onAction,
  actionLabel,
}) => {
  const { text: timeRemaining, isUrgent } = formatTimeRemaining(donation.expiresAt);

  // Dynamic real-time urgency recalculation
  const target = new Date(donation.expiresAt || donation.availableUntil || "").getTime();
  const mins = isNaN(target) ? 180 : Math.max(0, Math.round((target - Date.now()) / (60 * 1000)));

  let urgencyLabel = "Low";
  let urgencyVariant: "danger" | "warning" | "info" | "neutral" = "neutral";
  if (mins <= 60) {
    urgencyLabel = "Critical";
    urgencyVariant = "danger";
  } else if (mins <= 120) {
    urgencyLabel = "High";
    urgencyVariant = "warning";
  } else if (mins <= 240) {
    urgencyLabel = "Medium";
    urgencyVariant = "info";
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge status={donation.status} />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isUrgent ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-slate-100 text-slate-600"
              }`}
            >
              <Clock className="w-3 h-3" />
              {timeRemaining}
            </span>
            <Badge variant={urgencyVariant} size="sm">
              {urgencyLabel} Urgency
            </Badge>
          </div>
        </div>

        {/* Title & Category */}
        <div>
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            {donation.foodType}
          </span>
          <h3 className="text-base font-bold text-slate-900 line-clamp-1 mt-0.5">
            {donation.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
            {donation.description}
          </p>
        </div>

        {/* Portion & Quantity */}
        <div className="bg-slate-50 rounded-lg p-2.5 flex items-center justify-between text-xs border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Utensils className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">{donation.quantity} {donation.unit}</span>
            <span className="text-slate-400">({donation.servingsEstimate} portions)</span>
          </div>
          <span className="text-slate-500 font-medium">{donation.donorCategory}</span>
        </div>

        {/* Location & Pickup window */}
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{donation.pickupAddress.street}, {donation.pickupAddress.city}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {donation.pickupTimeWindow?.start
                ? `Pickup: ${donation.pickupTimeWindow.start} – ${donation.pickupTimeWindow.end}`
                : `Expires: ${new Date(donation.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
            </span>
          </div>
        </div>

        {/* Dietary tags */}
        {donation.dietaryInfo && donation.dietaryInfo.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {donation.dietaryInfo.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-100"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          href={`/donor/donations/${donation.id}`}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
        >
          View Details <ArrowRight className="w-3 h-3" />
        </Link>

        {actionLabel && (
          <Button
            size="sm"
            variant={viewMode === "ngo" ? "primary" : "outline"}
            onClick={() => onAction && onAction(donation)}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
