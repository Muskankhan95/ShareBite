import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { ListScreen } from "@/components/dashboard/list-screen";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/_authenticated/ngo/requests")({
  component: FoodRequests,
});

function FoodRequests() {
  return (
    <ListScreen
      title="Food requests"
      description="Requests your organization has sent to donors."
      emptyTitle="No requests sent yet"
      emptyDescription="Requests you send from nearby listings will be tracked here until the donor responds."
      emptyIcon={Inbox}
      feature="Food request workflow"
      planned={[
        "Send and withdraw requests",
        "Donor approval notifications",
        "Requested quantity negotiation",
        "Auto-expiry of stale requests",
      ]}
    >
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>
      </Tabs>
    </ListScreen>
  );
}
