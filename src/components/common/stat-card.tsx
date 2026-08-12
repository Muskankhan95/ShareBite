import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/70 shadow-[var(--shadow-card)]", className)}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-2xl font-semibold sm:text-3xl">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Icon className="size-5" />
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
