import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, PackagePlus } from "lucide-react";
import { ListScreen } from "@/components/dashboard/list-screen";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/_authenticated/donor/donations/")({
  component: MyDonations,
});

function MyDonations() {
  return (
    <ListScreen
      title="My donations"
      description="Every donation you have listed, grouped by status."
      actions={
        <Button asChild variant="hero">
          <Link to="/donor/donations/new">
            <PackagePlus />
            Create donation
          </Link>
        </Button>
      }
      emptyTitle="No donations to show"
      emptyDescription="Listings you create will appear here with their pickup window and current status."
      emptyIcon={Package}
      emptyAction={
        <Button asChild variant="soft" size="sm">
          <Link to="/donor/donations/new">Create donation</Link>
        </Button>
      }
      feature="Donation list and filters"
      planned={[
        "Status filters and search",
        "Pickup window countdown",
        "NGO request notifications",
        "Cancel or edit a listing",
      ]}
    >
      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="in_transit">In transit</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
        </TabsList>
      </Tabs>
    </ListScreen>
  );
}
