import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { ListScreen } from "@/components/dashboard/list-screen";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/_authenticated/volunteer/my-pickups")({
  component: MyPickups,
});

function MyPickups() {
  return (
    <ListScreen
      title="My pickups"
      description="Assignments you have accepted and their current stage."
      emptyTitle="No active pickups"
      emptyDescription="Pickups you accept will appear here with collection and delivery steps."
      emptyIcon={Truck}
      feature="Assigned pickup management"
      planned={[
        "Stage-by-stage checklist",
        "Contact donor or NGO",
        "Cancel or hand over a pickup",
        "Delivery confirmation",
      ]}
    >
      <Tabs defaultValue="assigned">
        <TabsList>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="picked_up">Picked up</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
        </TabsList>
      </Tabs>
    </ListScreen>
  );
}
