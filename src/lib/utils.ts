import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTimeRemaining(expiresAt: string): {
  text: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) {
    return { text: "Expired", isUrgent: false, isExpired: true };
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours < 2) {
    return {
      text: `${hours > 0 ? `${hours}h ` : ""}${minutes}m left`,
      isUrgent: true,
      isExpired: false,
    };
  }
  return {
    text: `${hours} hours left`,
    isUrgent: false,
    isExpired: false,
  };
}

export function getStatusBadgeVariant(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status.toLowerCase()) {
    case "published":
    case "available":
    case "verified":
    case "completed":
    case "delivered":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
      };
    case "matched":
    case "accepted":
    case "assigned":
    case "pickup_assigned":
    case "at_pickup":
    case "in_transit":
    case "on_the_way":
    case "picked_up":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      };
    case "draft":
    case "requested":
    case "pending":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
      };
    case "unavailable":
    case "offline":
      return {
        bg: "bg-slate-100",
        text: "text-slate-600",
        border: "border-slate-300",
      };
    case "urgent":
    case "critical":
    case "high":
    case "cancelled":
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
      };
    case "expired":
    case "rejected":
    case "failed":
      return {
        bg: "bg-slate-100",
        text: "text-slate-600",
        border: "border-slate-300",
      };
    default:
      return {
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-200",
      };
  }
}
