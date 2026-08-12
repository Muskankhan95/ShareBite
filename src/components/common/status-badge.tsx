import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";
import type { DonationStatus, PickupStatus, VerificationStatus } from "@/types";

type AnyStatus = DonationStatus | PickupStatus | VerificationStatus | "active" | "inactive";

const tone: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  available: "bg-primary-soft text-secondary-foreground",
  open: "bg-primary-soft text-secondary-foreground",
  requested: "bg-info/15 text-info",
  pending: "bg-warning/20 text-warning-foreground",
  accepted: "bg-info/15 text-info",
  approved: "bg-success/15 text-success",
  assigned: "bg-info/15 text-info",
  in_transit: "bg-accent/25 text-accent-foreground",
  picked_up: "bg-accent/25 text-accent-foreground",
  delivered: "bg-success/15 text-success",
  verified: "bg-success/15 text-success",
  active: "bg-success/15 text-success",
  inactive: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/12 text-destructive",
  declined: "bg-destructive/12 text-destructive",
  rejected: "bg-destructive/12 text-destructive",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AnyStatus | string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-transparent px-2.5 py-0.5 text-xs font-semibold",
        tone[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {titleCase(status)}
    </Badge>
  );
}
