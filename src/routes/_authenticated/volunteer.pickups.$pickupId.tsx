import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/states";
import { NotImplementedPanel } from "@/components/common/not-implemented-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/volunteer/pickups/$pickupId")({
  component: PickupDetails,
});

function PickupDetails() {
  const { pickupId } = useParams({ from: "/_authenticated/volunteer/pickups/$pickupId" });

  return (
    <>
      <PageHeader
        title="Pickup details"
        description={`Reference ${pickupId}`}
        actions={
          <Button asChild variant="outline">
            <Link to="/volunteer/pickups">
              <ArrowLeft />
              Back to pickups
            </Link>
          </Button>
        }
      />

      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Assignment</CardTitle>
            <CardDescription>Pickup and drop-off information.</CardDescription>
          </div>
          <StatusBadge status="open" />
        </CardHeader>
        <CardContent>
          <ErrorState
            title="Pickup could not be loaded"
            description="Pickup assignments are not stored yet, so there is nothing to read for this reference."
          />
        </CardContent>
      </Card>

      <NotImplementedPanel
        feature="Pickup detail view"
        planned={[
          "Donor and NGO contact details",
          "Turn-by-turn route link",
          "Mark collected and delivered",
          "Photo proof of delivery",
        ]}
      />
    </>
  );
}
