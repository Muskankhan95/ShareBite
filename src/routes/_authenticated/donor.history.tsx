import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History, Package, Clock, CheckCircle2, ArrowRight, Loader2, Award } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/states";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listMyDonations } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/donor/history")({
  head: () => ({
    meta: [
      { title: "Donation History — ShareBite" },
      { name: "description", content: "Historical record of past and delivered surplus food donations." },
    ],
  }),
  component: DonorHistory,
});

function DonorHistory() {
  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["myDonations"],
    queryFn: () => listMyDonations(),
  });

  const historyDonations = donations.filter((d) =>
    ["delivered", "expired", "cancelled"].includes(d.status),
  );

  const deliveredDonations = donations.filter((d) => d.status === "delivered");
  const totalMeals = deliveredDonations.reduce((sum, d) => sum + (d.servings || 0), 0);
  const totalWeightKg = deliveredDonations
    .filter((d) => d.quantity_unit === "kg")
    .reduce((sum, d) => sum + Number(d.quantity || 0), 0);

  return (
    <>
      <PageHeader
        title="Donation History"
        description="A complete record of past distributions and your cumulative community impact."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Meals delivered"
          value={isLoading ? "…" : String(totalMeals)}
          hint="Fed individuals in need"
          icon={Award}
        />
        <StatCard
          label="Food rescued (kg)"
          value={isLoading ? "…" : `${totalWeightKg.toFixed(1)} kg`}
          hint="Diverted from landfill"
          icon={Package}
        />
        <StatCard
          label="Completed runs"
          value={isLoading ? "…" : String(deliveredDonations.length)}
          hint="Successful handoffs"
          icon={History}
        />
      </section>

      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-lg">Archived Donations</CardTitle>
          <CardDescription>Past completed, expired, or cancelled listings.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : historyDonations.length === 0 ? (
            <EmptyState
              title="No past donations yet"
              description="As food donations complete their delivery cycle, they will be archived here for impact reporting."
              icon={History}
              action={
                <Button asChild variant="outline" size="sm">
                  <Link to="/donor/donations/new">Post a donation</Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-border/60">
              {historyDonations.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{item.food_name}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{item.quantity} {item.quantity_unit} ({item.servings} meals)</span>
                      <span>•</span>
                      <span>
                        Created: {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </p>
                  </div>

                  <Button asChild variant="outline" size="sm" className="h-8 gap-1 shrink-0">
                    <Link to="/donor/donations/$donationId" params={{ donationId: item.id }}>
                      View details
                      <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
