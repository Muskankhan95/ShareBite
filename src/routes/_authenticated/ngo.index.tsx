import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Handshake,
  Inbox,
  MapPin,
  Soup,
  ShieldCheck,
  Clock,
  ArrowRight,
  Send,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Utensils,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getNgoDashboardStats, listNearbyDonations } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/ngo/")({
  head: () => ({
    meta: [
      { title: "NGO Dashboard — ShareBite" },
      { name: "description", content: "Overview of nearby surplus food, active requests, and incoming deliveries." },
    ],
  }),
  component: NgoDashboard,
});

function NgoDashboard() {
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["ngoDashboardStats"],
    queryFn: () => getNgoDashboardStats(),
    refetchInterval: 30000,
  });

  const { data: nearby = [], isLoading: isLoadingNearby } = useQuery({
    queryKey: ["nearbyDonations"],
    queryFn: () => listNearbyDonations(),
  });

  const isVerified = stats?.verificationStatus === "verified";
  const recentNearby = nearby.slice(0, 3);

  return (
    <>
      <PageHeader
        title="NGO Dashboard"
        description="Monitor surplus food availability, track incoming logistics, and manage food relief distribution."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/ngo/requests">
                <Inbox className="size-4" />
                My Requests
              </Link>
            </Button>
            <Button asChild variant="hero">
              <Link to="/ngo/nearby">
                <MapPin className="size-4" />
                Find Nearby Food
              </Link>
            </Button>
          </div>
        }
      />

      {/* Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Nearby Listings"
          value={isLoadingStats ? "..." : String(stats?.nearbyCount ?? 0)}
          hint="Surplus batches available now"
          icon={MapPin}
        />
        <StatCard
          label="Open Requests"
          value={isLoadingStats ? "..." : String(stats?.openRequestsCount ?? 0)}
          hint="Awaiting donor approval"
          icon={Inbox}
        />
        <StatCard
          label="Incoming Deliveries"
          value={isLoadingStats ? "..." : String(stats?.acceptedCount ?? 0)}
          hint="Accepted or en route"
          icon={Handshake}
        />
        <StatCard
          label="Meals Received"
          value={isLoadingStats ? "..." : String(stats?.mealsReceived ?? 0)}
          hint="Delivered portions all time"
          icon={Soup}
        />
      </section>

      {/* Verification Status Banner */}
      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Organization Verification
            </CardTitle>
            <CardDescription className="text-xs">
              Official NGO verification status on ShareBite.
            </CardDescription>
          </div>
          <StatusBadge status={stats?.verificationStatus || "pending"} />
        </CardHeader>
        <CardContent>
          {isVerified ? (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>
                Your organization is fully verified to claim surplus food and coordinate deliveries.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="size-4 shrink-0" />
              <span>
                Verification review is active with the administration team. You can still discover and submit food requests.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Available Food Feed */}
      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Fresh Food Available Near You</CardTitle>
            <CardDescription>Recently posted surplus batches ready for distribution.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/ngo/nearby">
              View All ({nearby.length})
              <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingNearby ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : recentNearby.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-8 text-center">
              <MapPin className="size-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-sm font-semibold text-foreground">No available food right now</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Check back shortly. When local restaurants, hotels, or events log surplus batches, they will show up here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {recentNearby.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/70 p-4 bg-card/60 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase text-primary tracking-wide">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3 text-amber-600" />
                        {new Date(item.available_until).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <h4 className="font-bold text-foreground text-sm line-clamp-1">{item.food_name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                      <MapPin className="size-3 text-primary shrink-0" />
                      {item.pickup_address}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {item.quantity} {item.quantity_unit} (~{item.servings} meals)
                    </span>
                    <Button asChild size="sm" variant="hero" className="h-7 text-xs">
                      <Link to="/ngo/nearby">
                        <Send className="size-3 mr-1" />
                        Request
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
