import { createFileRoute, Link } from "@tanstack/react-router";
import { Handshake, Inbox, MapPin, Soup } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/states";
import { NotImplementedPanel } from "@/components/common/not-implemented-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/_authenticated/ngo/")({
  component: NgoDashboard,
});

function NgoDashboard() {
  return (
    <>
      <PageHeader
        title="NGO dashboard"
        description="Track nearby availability, your open requests and food you have accepted."
        actions={
          <Button asChild variant="hero">
            <Link to="/ngo/nearby">
              <MapPin />
              Find nearby food
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Nearby listings" value="—" hint="Within your service area" icon={MapPin} />
        <StatCard label="Open requests" value="—" hint="Awaiting donor approval" icon={Inbox} />
        <StatCard label="Accepted" value="—" hint="Pickup scheduled" icon={Handshake} />
        <StatCard label="Meals received" value="—" hint="All time" icon={Soup} />
      </section>

      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Verification status</CardTitle>
            <CardDescription>
              Organizations must be verified before they can receive food.
            </CardDescription>
          </div>
          <StatusBadge status="pending" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Verification review is handled by the platform admin team. The workflow, document upload
            and approval decisions are not implemented yet.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-lg">Latest nearby food</CardTitle>
          <CardDescription>Live listings around your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Nothing available right now"
            description="Available donations near your location will be listed here as soon as donations go live."
            icon={MapPin}
          />
        </CardContent>
      </Card>

      <NotImplementedPanel
        feature="NGO dashboard metrics"
        planned={[
          "Distance-based listing feed",
          "Request status tracking",
          "Capacity planning",
          "Delivery confirmations",
        ]}
      />
    </>
  );
}
