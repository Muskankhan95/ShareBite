import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Package, Route as RouteIcon, Truck } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/states";
import { NotImplementedPanel } from "@/components/common/not-implemented-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/volunteer/")({
  component: VolunteerDashboard,
});

function VolunteerDashboard() {
  return (
    <>
      <PageHeader
        title="Volunteer dashboard"
        description="See what needs collecting near you and keep track of your deliveries."
        actions={
          <Button asChild variant="hero">
            <Link to="/volunteer/pickups">
              <Package />
              Browse pickups
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open pickups" value="—" hint="Available near you" icon={Package} />
        <StatCard label="Active pickup" value="—" hint="Currently assigned" icon={Truck} />
        <StatCard label="Deliveries done" value="—" hint="All time" icon={CheckCircle2} />
        <StatCard label="Distance covered" value="—" hint="Kilometres travelled" icon={RouteIcon} />
      </section>

      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-lg">Pickups near you</CardTitle>
          <CardDescription>Open collection tasks waiting for a volunteer.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No open pickups"
            description="Available pickup tasks will appear here once donations and assignments go live."
            icon={Package}
          />
        </CardContent>
      </Card>

      <NotImplementedPanel
        feature="Volunteer dashboard metrics"
        planned={[
          "Nearby pickup feed",
          "Active route progress",
          "Delivery streaks and impact",
          "Availability scheduling",
        ]}
      />
    </>
  );
}
