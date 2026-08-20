import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { ListScreen } from "@/components/dashboard/list-screen";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/ngos")({
  component: AdminNgos,
});

function AdminNgos() {
  return (
    <ListScreen
      title="NGOs"
      description="Review organizations and manage their verification status."
      emptyTitle="No organizations yet"
      emptyDescription="NGO applications with registration documents will appear here for review."
      emptyIcon={Building2}
      feature="NGO verification"
      planned={[
        "Document review and approval",
        "Rejection with reason",
        "Re-verification reminders",
        "Service area and capacity records",
      ]}
    >
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>
    </ListScreen>
  );
}
