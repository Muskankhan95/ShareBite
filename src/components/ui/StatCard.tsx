import React from "react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  variant?: "default" | "emerald" | "amber" | "blue" | "danger";
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  trend,
  icon,
  variant = "default",
  className,
}) => {
  const iconBgMap = {
    default: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border border-amber-100",
    blue: "bg-blue-50 text-blue-600 border border-blue-100",
    danger: "bg-rose-50 text-rose-600 border border-rose-100",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h4>
        </div>
        {icon && (
          <div className={cn("p-2.5 rounded-lg shrink-0", iconBgMap[variant])}>
            {icon}
          </div>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs">
          {trend && (
            <span
              className={cn(
                "font-semibold mr-2 flex items-center",
                trend.isPositive ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {trend.isPositive ? "↑ " : "↓ "}
              {trend.value}
            </span>
          )}
          {subtext && <span className="text-slate-500 truncate">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
