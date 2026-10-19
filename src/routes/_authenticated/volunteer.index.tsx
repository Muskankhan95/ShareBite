import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Package,
  Route as RouteIcon,
  Truck,
  MapPin,
  ArrowRight,
  Clock,
  Navigation,
  Loader2,
  Utensils,
  Soup,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getVolunteerDashboardStats, listAvailablePickups, listMyPickups } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/volunteer/")({
  head: () => ({
    meta: [
      { title: "Volunteer Courier Dashboard — ShareBite" },
      { name: "description", content: "Overview of open collection tasks, active deliveries, and community impact." },
    ],
  }),
  component: VolunteerDashboard,
});

function VolunteerDashboard() {
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["volunteerStats"],
    queryFn: () => getVolunteerDashboardStats(),
    refetchInterval: 30000,
  });

  const { data: openPickups = [], isLoading: isLoadingPickups } = useQuery({
    queryKey: ["availablePickups"],
    queryFn: () => listAvailablePickups(),
  });

  const { data: myPickups = [] } = useQuery({
    queryKey: ["myPickups"],
    queryFn: () => listMyPickups(),
  });

  const activeTask = myPickups.find((p) => ["assigned", "picked_up"].includes(p.status));
  const recentOpen = openPickups.slice(0, 3);

  return (
    <>
      <PageHeader
        title="Volunteer Courier Dashboard"
        description="Connect food donors with recipient shelters by providing reliable, swift surplus food transport."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/volunteer/my-pickups">
                <Truck className="size-4" />
                My Active Tasks
              </Link>
            </Button>
            <Button asChild variant="hero">
              <Link to="/volunteer/pickups">
                <Package className="size-4" />
                Browse Marketplace
              </Link>
            </Button>
          </div>
        }
      />

      {/* Active Task Banner if an assignment is underway */}
      {activeTask && (
        <Card className="border-primary/60 bg-primary/5 shadow-[var(--shadow-card)] mb-6">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Truck className="size-5 text-primary animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-primary tracking-wide">
                    Active Delivery Run
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary capitalize">
                    {activeTask.status === "assigned" ? "Head to Donor" : "In Transit to NGO"}
                  </span>
                </div>
                <p className="font-bold text-foreground text-sm mt-0.5">
                  {activeTask.donation?.food_name || "Surplus Food Package"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Drop-off: {activeTask.ngo?.organization_name || "NGO"} ({activeTask.delivery_location})
                </p>
              </div>
            </div>

            <Button asChild variant="hero" size="sm" className="shrink-0">
              <Link to="/volunteer/pickups/$pickupId" params={{ pickupId: activeTask.id }}>
                View Turn-by-Turn Route
                <ArrowRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          label="Open Pickups"
          value={isLoadingStats ? "..." : String(stats?.openPickupsCount ?? 0)}
          hint="Waiting for a volunteer"
          icon={Package}
        />
        <StatCard
          label="Active Runs"
          value={isLoadingStats ? "..." : String(stats?.activePickupsCount ?? 0)}
          hint="Assigned to your vehicle"
          icon={Truck}
        />
        <StatCard
          label="Deliveries Done"
          value={isLoadingStats ? "..." : String(stats?.deliveriesDone ?? 0)}
          hint="Completed all time"
          icon={CheckCircle2}
        />
        <StatCard
          label="Meals Delivered"
          value={isLoadingStats ? "..." : String(stats?.mealsDelivered ?? 0)}
          hint="Portions safely delivered"
          icon={Soup}
        />
      </section>

      {/* Pickups Near You Marketplace Feed */}
      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Pickups Waiting for a Courier</CardTitle>
            <CardDescription>Open tasks ready to be accepted and delivered.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/volunteer/pickups">
              View All ({openPickups.length})
              <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingPickups ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : recentOpen.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-8 text-center">
              <Package className="size-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-sm font-semibold text-foreground">No open pickups right now</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                All approved donations currently have assigned couriers. New pickup tasks will appear as soon as donors approve requests.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {recentOpen.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/70 p-4 bg-card/60 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase text-primary tracking-wide">
                        {item.donation?.category || "Surplus"}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3 text-amber-600" />
                        Ready now
                      </span>
                    </div>

                    <h4 className="font-bold text-foreground text-sm line-clamp-1">
                      {item.donation?.food_name || "Food Package"}
                    </h4>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="line-clamp-1 flex items-center gap-1">
                        <MapPin className="size-3 text-primary shrink-0" />
                        {item.pickup_location}
                      </p>
                      <p className="line-clamp-1 flex items-center gap-1">
                        <Navigation className="size-3 text-emerald-600 shrink-0" />
                        {item.ngo?.organization_name || "NGO"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      ~{item.donation?.servings || 0} meals
                    </span>
                    <Button asChild size="sm" variant="hero" className="h-7 text-xs">
                      <Link to="/volunteer/pickups/$pickupId" params={{ pickupId: item.id }}>
                        Claim
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
