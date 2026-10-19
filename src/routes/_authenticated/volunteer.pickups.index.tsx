import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  MapPin,
  Clock,
  Utensils,
  Search,
  Navigation,
  Building2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Truck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAvailablePickups, claimPickup } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/volunteer/pickups/")({
  head: () => ({
    meta: [
      { title: "Available Food Pickups — ShareBite" },
      { name: "description", content: "Claim open surplus food pickup and delivery tasks to help local NGOs." },
    ],
  }),
  component: AvailablePickups,
});

function AvailablePickups() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "servings">("newest");

  const { data: pickups = [], isLoading } = useQuery({
    queryKey: ["availablePickups"],
    queryFn: () => listAvailablePickups(),
    refetchInterval: 15000,
  });

  const claimMutation = useMutation({
    mutationFn: (id: string) => claimPickup({ data: { id } }),
    onSuccess: (claimed) => {
      toast.success("Pickup task claimed! You are now the assigned courier.");
      queryClient.invalidateQueries({ queryKey: ["availablePickups"] });
      queryClient.invalidateQueries({ queryKey: ["myPickups"] });
      queryClient.invalidateQueries({ queryKey: ["volunteerStats"] });
      navigate({ to: `/volunteer/pickups/$pickupId`, params: { pickupId: claimed.id } });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to claim pickup");
    },
  });

  const filteredPickups = useMemo(() => {
    let result = pickups.filter((item) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const foodMatch = item.donation?.food_name?.toLowerCase().includes(q) ?? false;
      const pickupMatch = item.pickup_location?.toLowerCase().includes(q) ?? false;
      const dropMatch = item.delivery_location?.toLowerCase().includes(q) ?? false;
      const ngoMatch = item.ngo?.organization_name?.toLowerCase().includes(q) ?? false;
      return foodMatch || pickupMatch || dropMatch || ngoMatch;
    });

    if (sortBy === "servings") {
      result = [...result].sort((a, b) => (b.donation?.servings || 0) - (a.donation?.servings || 0));
    }

    return result;
  }, [pickups, search, sortBy]);

  return (
    <>
      <PageHeader
        title="Open Pickup Marketplace"
        description="Claim collection and transport assignments to deliver surplus food from donors to recipient organizations."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/volunteer/my-pickups">
                <Truck className="size-4" />
                My Active Tasks
              </Link>
            </Button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              {pickups.length} Open Tasks
            </span>
          </div>
        }
      />

      {/* Search & Sort Bar */}
      <Card className="border-border/70 shadow-[var(--shadow-card)] mb-6">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by area, food type, or recipient NGO..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Recently Published</SelectItem>
                <SelectItem value="servings">Largest Portion First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Marketplace Cards */}
      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredPickups.length === 0 ? (
        <Card className="border-border/70 p-12 text-center shadow-[var(--shadow-card)]">
          <div className="size-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <Package className="size-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No open pickups right now</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {search.trim()
              ? "No tasks match your search filter. Try clearing the query."
              : "All donations currently have assigned couriers. Check back in a few minutes as new donations are accepted."}
          </p>
          {search.trim() && (
            <Button variant="outline" className="mt-4" onClick={() => setSearch("")}>
              Reset search
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredPickups.map((pickup) => {
            const donation = pickup.donation;
            const ngo = pickup.ngo;

            return (
              <Card
                key={pickup.id}
                className="flex flex-col justify-between border-border/70 shadow-[var(--shadow-card)] hover:border-primary/50 transition-all"
              >
                <div>
                  <CardHeader className="pb-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="capitalize text-xs font-semibold">
                        {donation?.category || "Food Rescue"}
                      </Badge>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                        <Clock className="size-3" /> Ready for pickup
                      </span>
                    </div>

                    <CardTitle className="text-lg font-bold line-clamp-1">
                      {donation?.food_name || "Surplus Batch"}
                    </CardTitle>

                    {donation && (
                      <p className="text-xs font-semibold text-primary">
                        {donation.servings} meals ({donation.quantity} {donation.quantity_unit})
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 pb-3 text-xs text-muted-foreground">
                    {/* Routing Details */}
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2.5">
                      <div className="flex items-start gap-2">
                        <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-foreground">Pickup from Donor:</span>
                          <p className="line-clamp-2 mt-0.5">{pickup.pickup_location}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 pt-1 border-t border-border/40">
                        <Navigation className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-foreground">
                            Deliver to {ngo?.organization_name || "NGO Center"}:
                          </span>
                          <p className="line-clamp-2 mt-0.5">{pickup.delivery_location}</p>
                        </div>
                      </div>
                    </div>

                    {donation?.storage_method && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Storage condition:</span>
                        <span className="font-semibold text-foreground capitalize">
                          {donation.storage_method}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </div>

                <CardFooter className="pt-2 border-t border-border/50 flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="w-1/2">
                    <Link to="/volunteer/pickups/$pickupId" params={{ pickupId: pickup.id }}>
                      View Details
                    </Link>
                  </Button>

                  <Button
                    variant="hero"
                    size="sm"
                    className="w-1/2 cursor-pointer"
                    disabled={claimMutation.isPending}
                    onClick={() => claimMutation.mutate(pickup.id)}
                  >
                    {claimMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin mr-1" />
                    ) : (
                      <Truck className="size-3.5 mr-1" />
                    )}
                    Claim Task
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
