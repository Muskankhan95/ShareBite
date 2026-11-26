import React from "react";
import { cn, getStatusBadgeVariant } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral"
    | "outline";
  status?: string;
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  children,
  variant,
  status,
  size = "md",
  dot = false,
  ...props
}) => {
  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";

  if (status) {
    const s = getStatusBadgeVariant(status);
    colorClasses = `${s.bg} ${s.text} ${s.border}`;
  } else if (variant === "success") {
    colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (variant === "warning") {
    colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (variant === "danger") {
    colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (variant === "info") {
    colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (variant === "outline") {
    colorClasses = "bg-transparent text-slate-700 border-slate-300";
  }

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs font-medium" : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-colors capitalize",
        sizeClasses,
        colorClasses,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "danger"
              ? "bg-rose-500"
              : variant === "warning"
              ? "bg-amber-500"
              : variant === "info"
              ? "bg-blue-500"
              : "bg-emerald-500"
          )}
        />
      )}
      {children || status?.replace("_", " ")}
    </span>
  );
};
