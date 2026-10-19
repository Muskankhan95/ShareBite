import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History, Package, PackagePlus, Soup, Truck, ArrowRight, Loader2, Clock } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listMyDonations } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/donor/")({
  head: () => ({
    meta: [
      { title: "Donor Dashboard — ShareBite" },
      { name: "description", content: "Overview of your food donations and community impact." },
    ],
  }),
  component: DonorDashboard,
});

function DonorDashboard() {
  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["myDonations"],
    queryFn: () => listMyDonations(),
  });

  const activeDonations = donations.filter((d) => d.status === "available").length;
  const inTransitDonations = donations.filter((d) =>
    ["requested", "accepted", "in_transit"].includes(d.status),
  ).length;
  const completedDonations = donations.filter((d) => d.status === "delivered");
  const totalMealsRescued = completedDonations.reduce((sum, d) => sum + (d.servings || 0), 0);

  const recentDonations = donations.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Donor Dashboard"
        description="Monitor your active surplus food listings, delivery coordination, and rescued meals."
        actions={
          <Button asChild variant="hero">
            <Link to="/donor/donations/new">
              <PackagePlus className="size-4" />
              Create donation
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active listings"
          value={isLoading ? "…" : String(activeDonations)}
          hint="Awaiting NGO match"
          icon={Package}
        />
        <StatCard
          label="In transit"
          value={isLoading ? "…" : String(inTransitDonations)}
          hint="Volunteers coordinating"
          icon={Truck}
        />
        <StatCard
          label="Meals rescued"
          value={isLoading ? "…" : String(totalMealsRescued)}
          hint="Total plates delivered"
          icon={Soup}
        />
        <StatCard
          label="Completed runs"
          value={isLoading ? "…" : String(completedDonations.length)}
          hint="Delivered donations"
          icon={History}
        />
      </section>

      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Listings</CardTitle>
            <CardDescription>Your latest surplus food contributions.</CardDescription>
          </div>
          {donations.length > 5 ? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/donor/donations">
                View all ({donations.length})
                <ArrowRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-36 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : recentDonations.length === 0 ? (
            <EmptyState
              title="No food listings yet"
              description="Post excess edible food from your kitchen or event to prevent waste and feed local shelters."
              icon={Package}
              action={
                <Button asChild variant="hero" size="sm">
                  <Link to="/donor/donations/new">List your first donation</Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-border/60">
              {recentDonations.map((item) => (
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
                      <span>{item.quantity} {item.quantity_unit} ({item.servings} servings)</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        Available until: {new Date(item.available_until).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="h-8 gap-1 shrink-0">
                    <Link to="/donor/donations/$donationId" params={{ donationId: item.id }}>
                      View
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
