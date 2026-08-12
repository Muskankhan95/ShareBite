import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl",
          onDark ? "bg-primary-foreground/15 text-primary-foreground" : "bg-gradient-hero text-primary-foreground",
        )}
        aria-hidden="true"
      >
        <Leaf className="size-5" />
      </span>
      <span
        className={cn(
          "font-display text-lg font-semibold tracking-tight",
          onDark ? "text-primary-foreground" : "text-foreground",
        )}
      >
        Food<span className="text-primary">Rescue</span>
      </span>
    </Link>
  );
}
