import { createFileRoute, Link } from "@tanstack/react-router";
import { History, Package, PackagePlus, Soup, Truck } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/states";
import { NotImplementedPanel } from "@/components/common/not-implemented-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/donor/")({
  component: DonorDashboard,
});

function DonorDashboard() {
  return (
    <>
      <PageHeader
        title="Donor dashboard"
        description="An overview of your surplus food listings, active pickups and community impact."
        actions={
          <Button asChild variant="hero">
            <Link to="/donor/donations/new">
              <PackagePlus />
              Create donation
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active donations" value="—" hint="Awaiting requests" icon={Package} />
        <StatCard label="In transit" value="—" hint="Volunteer on the way" icon={Truck} />
        <StatCard label="Meals rescued" value="—" hint="All time" icon={Soup} />
        <StatCard label="Completed" value="—" hint="Delivered donations" icon={History} />
      </section>

      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-lg">Recent donations</CardTitle>
          <CardDescription>Your most recent listings will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No donations yet"
            description="Once donation tracking is live, your latest listings and their status will be shown here."
            icon={Package}
            action={
              <Button asChild variant="soft" size="sm">
                <Link to="/donor/donations/new">Create your first donation</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>

      <NotImplementedPanel
        feature="Donor dashboard metrics"
        planned={[
          "Live donation counters",
          "Pickup status timeline",
          "Impact summary per month",
          "Notifications from NGOs",
        ]}
      />
    </>
  );
}
