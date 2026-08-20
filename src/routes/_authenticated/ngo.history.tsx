import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { ListScreen } from "@/components/dashboard/list-screen";

export const Route = createFileRoute("/_authenticated/ngo/history")({
  component: NgoHistory,
});

function NgoHistory() {
  return (
    <ListScreen
      title="Donation history"
      description="All food your organization has received through FoodRescue."
      emptyTitle="No received donations yet"
      emptyDescription="Completed deliveries will be archived here with donor details and quantities."
      emptyIcon={History}
      feature="NGO donation history"
      planned={[
        "Date range filters",
        "Donor and volunteer records",
        "Servings received per month",
        "CSV export for reporting",
      ]}
    />
  );
}
