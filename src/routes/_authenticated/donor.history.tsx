import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { ListScreen } from "@/components/dashboard/list-screen";

export const Route = createFileRoute("/_authenticated/_authenticated/donor/history")({
  component: DonorHistory,
});

function DonorHistory() {
  return (
    <ListScreen
      title="Donation history"
      description="A record of completed, expired and cancelled donations."
      emptyTitle="No history yet"
      emptyDescription="Completed donations will be archived here with the organization that received them."
      emptyIcon={History}
      feature="Donation history"
      planned={[
        "Date range filters",
        "Receiving organization per donation",
        "Downloadable CSV export",
        "Per-month impact totals",
      ]}
    />
  );
}
