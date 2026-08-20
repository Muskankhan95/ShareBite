import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/states";
import { NotImplementedPanel } from "@/components/common/not-implemented-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/donor/donations/$donationId")({
  component: DonationDetails,
});

function DonationDetails() {
  const { donationId } = useParams({ from: "/donor/donations/$donationId" });

  return (
    <>
      <PageHeader
        title="Donation details"
        description={`Reference ${donationId}`}
        actions={
          <Button asChild variant="outline">
            <Link to="/donor/donations">
              <ArrowLeft />
              Back to donations
            </Link>
          </Button>
        }
      />

      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Status</CardTitle>
            <CardDescription>Lifecycle of this donation.</CardDescription>
          </div>
          <StatusBadge status="draft" />
        </CardHeader>
        <CardContent>
          <ErrorState
            title="Donation could not be loaded"
            description="Donation records are not stored yet, so there is nothing to read for this reference."
          />
        </CardContent>
      </Card>

      <NotImplementedPanel
        feature="Donation detail view"
        planned={[
          "Food items and quantities",
          "Pickup window and address map",
          "Requesting NGO and volunteer assignment",
          "Status timeline with timestamps",
        ]}
      />
    </>
  );
}
