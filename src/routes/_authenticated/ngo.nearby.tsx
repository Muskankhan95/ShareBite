import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { ListScreen } from "@/components/dashboard/list-screen";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/ngo/nearby")({
  component: NearbyFood,
});

function NearbyFood() {
  return (
    <ListScreen
      title="Nearby food"
      description="Surplus food currently available around your organization."
      emptyTitle="No nearby food available"
      emptyDescription="When donors publish surplus food near you, it will appear here with servings and pickup window."
      emptyIcon={MapPin}
      feature="Nearby food discovery"
      planned={[
        "Location-based search radius",
        "Sort by distance or expiry",
        "Request food directly from a listing",
        "Map view of pickup points",
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input placeholder="Search by area or food type" disabled />
        <Select disabled>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Radius" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">Within 5 km</SelectItem>
            <SelectItem value="10">Within 10 km</SelectItem>
            <SelectItem value="25">Within 25 km</SelectItem>
          </SelectContent>
        </Select>
        <Select disabled>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Food type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cooked">Cooked meals</SelectItem>
            <SelectItem value="raw">Raw ingredients</SelectItem>
            <SelectItem value="packaged">Packaged food</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </ListScreen>
  );
}
