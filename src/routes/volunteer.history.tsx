import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { ListScreen } from "@/components/dashboard/list-screen";

export const Route = createFileRoute("/volunteer/history")({
  component: DeliveryHistory,
});

function DeliveryHistory() {
  return (
    <ListScreen
      title="Delivery history"
      description="Every delivery you have completed with FoodRescue."
      emptyTitle="No deliveries yet"
      emptyDescription="Completed deliveries will be archived here with donor, organization and distance."
      emptyIcon={History}
      feature="Delivery history"
      planned={[
        "Date range filters",
        "Distance and duration per run",
        "Meals delivered totals",
        "Volunteer certificate export",
      ]}
    />
  );
}
