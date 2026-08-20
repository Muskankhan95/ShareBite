import { createFileRoute } from "@tanstack/react-router";
import { Handshake } from "lucide-react";
import { ListScreen } from "@/components/dashboard/list-screen";

export const Route = createFileRoute("/_authenticated/ngo/accepted")({
  component: AcceptedDonations,
});

function AcceptedDonations() {
  return (
    <ListScreen
      title="Accepted donations"
      description="Food approved for your organization and awaiting pickup or delivery."
      emptyTitle="Nothing accepted yet"
      emptyDescription="Approved donations, their assigned volunteer and expected delivery time will show up here."
      emptyIcon={Handshake}
      feature="Accepted donation tracking"
      planned={[
        "Assigned volunteer details",
        "Live delivery status",
        "Confirm receipt on arrival",
        "Report an issue with a delivery",
      ]}
    />
  );
}
