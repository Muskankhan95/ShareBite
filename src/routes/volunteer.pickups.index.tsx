import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { ListScreen } from "@/components/dashboard/list-screen";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/volunteer/pickups/")({
  component: AvailablePickups,
});

function AvailablePickups() {
  return (
    <ListScreen
      title="Available pickups"
      description="Collection tasks you can accept, sorted by distance once live."
      emptyTitle="No pickups available"
      emptyDescription="Open pickups with donor and drop-off addresses will be listed here."
      emptyIcon={Package}
      feature="Pickup marketplace"
      planned={[
        "Distance and time estimates",
        "Accept a pickup assignment",
        "Route preview to the NGO",
        "Pickup window reminders",
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input placeholder="Search by area" disabled />
        <Select disabled>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">Nearest first</SelectItem>
            <SelectItem value="expiry">Closing soonest</SelectItem>
            <SelectItem value="size">Largest donation</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </ListScreen>
  );
}
