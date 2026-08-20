import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { ListScreen } from "@/components/dashboard/list-screen";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/donations")({
  component: AdminDonations,
});

function AdminDonations() {
  return (
    <ListScreen
      title="Donations"
      description="Every donation on the platform and where it is in its lifecycle."
      emptyTitle="No donations recorded"
      emptyDescription="Donations from all donors will be listed here with status and assigned participants."
      emptyIcon={ClipboardList}
      feature="Donation oversight"
      planned={[
        "Status and city filters",
        "Force-cancel problematic listings",
        "Reassign volunteers",
        "Dispute resolution notes",
      ]}
    >
      <Input placeholder="Search by donor, city or reference" disabled />
    </ListScreen>
  );
}
