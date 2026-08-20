import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { ListScreen } from "@/components/dashboard/list-screen";

export const Route = createFileRoute("/_authenticated/_authenticated/admin/volunteers")({
  component: AdminVolunteers,
});

function AdminVolunteers() {
  return (
    <ListScreen
      title="Volunteers"
      description="Volunteer network, availability and delivery performance."
      emptyTitle="No volunteers yet"
      emptyDescription="Registered volunteers and their delivery records will be listed here."
      emptyIcon={Truck}
      feature="Volunteer oversight"
      planned={[
        "Availability and coverage map",
        "Completed vs cancelled runs",
        "Reliability scoring",
        "Onboarding checks",
      ]}
    />
  );
}
