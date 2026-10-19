import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  Package,
  Utensils,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listMyPickups, updatePickupStatus } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/volunteer/my-pickups")({
  head: () => ({
    meta: [
      { title: "My Pickups — ShareBite" },
      { name: "description", content: "Active and completed delivery runs assigned to you." },
    ],
  }),
  component: MyPickups,
});

function MyPickups() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");

  const { data: myPickups = [], isLoading } = useQuery({
    queryKey: ["myPickups"],
    queryFn: () => listMyPickups(),
    refetchInterval: 15000,
  });

  const advanceMutation = useMutation({
    mutationFn: (vars: { id: string; status: "picked_up" | "delivered" }) =>
      updatePickupStatus({ data: vars }),
    onSuccess: (_, vars) => {
      if (vars.status === "picked_up") {
        toast.success("Marked picked up! En route to recipient NGO.");
      } else {
        toast.success("Delivery completed successfully! Great job!");
      }
      queryClient.invalidateQueries({ queryKey: ["myPickups"] });
      queryClient.invalidateQueries({ queryKey: ["volunteerStats"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    },
  });

  const counts = useMemo(() => {
    const assigned = myPickups.filter((p) => p.status === "assigned").length;
    const pickedUp = myPickups.filter((p) => p.status === "picked_up").length;
    const delivered = myPickups.filter((p) => p.status === "delivered").length;
    return { all: myPickups.length, assigned, pickedUp, delivered };
  }, [myPickups]);

  const filteredPickups = useMemo(() => {
    if (activeTab === "all") return myPickups;
    return myPickups.filter((p) => p.status === activeTab);
  }, [myPickups, activeTab]);

  return (
    <>
      <PageHeader
        title="My Delivery Assignments"
        description="Active food courier runs assigned to your account and their current transit status."
        actions={
          <Button asChild variant="hero">
            <Link to="/volunteer/pickups">
              <Package className="size-4" />
              Browse Open Tasks
            </Link>
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-4 sm:w-[480px]">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="assigned">Assigned ({counts.assigned})</TabsTrigger>
          <TabsTrigger value="picked_up">In Transit ({counts.pickedUp})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({counts.delivered})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredPickups.length === 0 ? (
        <Card className="border-border/70 p-12 text-center shadow-[var(--shadow-card)]">
          <div className="size-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <Truck className="size-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No {activeTab === "all" ? "assigned" : activeTab} tasks found
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {activeTab === "assigned"
              ? "You do not have any tasks awaiting pickup from donor kitchens."
              : activeTab === "picked_up"
              ? "No food packages currently in transit to recipient organizations."
              : "Claim tasks from the open marketplace to start courier assignments."}
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/volunteer/pickups">Browse Marketplace</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPickups.map((pickup) => {
            const donation = pickup.donation;
            const ngo = pickup.ngo;
            const isAssigned = pickup.status === "assigned";
            const isPickedUp = pickup.status === "picked_up";
            const isDelivered = pickup.status === "delivered";

            return (
              <Card
                key={pickup.id}
                className="border-border/70 shadow-[var(--shadow-card)] hover:border-primary/40 transition-all"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-foreground">
                          {donation?.food_name || "Surplus Batch"}
                        </h4>
                        <StatusBadge status={pickup.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {donation?.servings && (
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <Utensils className="size-3.5 text-primary" />
                            ~{donation.servings} meals ({donation.quantity} {donation.quantity_unit})
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          Claimed {new Date(pickup.accepted_at || pickup.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2 pt-1 text-xs text-muted-foreground">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                          <span>Pickup: {pickup.pickup_location}</span>
                        </div>

                        <div className="flex items-start gap-1.5">
                          <Navigation className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            Deliver: {ngo?.organization_name || "NGO"} ({pickup.delivery_location})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/volunteer/pickups/$pickupId" params={{ pickupId: pickup.id }}>
                          View Route
                          <ArrowRight className="size-3.5 ml-1" />
                        </Link>
                      </Button>

                      {isAssigned && (
                        <Button
                          size="sm"
                          variant="hero"
                          disabled={advanceMutation.isPending}
                          onClick={() => advanceMutation.mutate({ id: pickup.id, status: "picked_up" })}
                        >
                          <Package className="size-3.5 mr-1" />
                          Mark Picked Up
                        </Button>
                      )}

                      {isPickedUp && (
                        <Button
                          size="sm"
                          variant="hero"
                          className="bg-emerald-600 hover:bg-emerald-500"
                          disabled={advanceMutation.isPending}
                          onClick={() => advanceMutation.mutate({ id: pickup.id, status: "delivered" })}
                        >
                          <CheckCircle2 className="size-3.5 mr-1" />
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
