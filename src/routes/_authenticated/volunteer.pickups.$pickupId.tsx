import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  Navigation,
  Phone,
  Building2,
  User,
  Utensils,
  Thermometer,
  ShieldAlert,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPickup, claimPickup, updatePickupStatus } from "@/lib/data.functions";
import { useAuth } from "@/lib/auth/auth-context";

export const Route = createFileRoute("/_authenticated/volunteer/pickups/$pickupId")({
  head: () => ({
    meta: [
      { title: "Pickup Assignment Details — ShareBite" },
      { name: "description", content: "Turn-by-turn routing and status coordinator for volunteer couriers." },
    ],
  }),
  component: PickupDetails,
});

function PickupDetails() {
  const { pickupId } = useParams({ from: "/_authenticated/volunteer/pickups/$pickupId" });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: pickup, isLoading, error } = useQuery({
    queryKey: ["pickup", pickupId],
    queryFn: () => getPickup({ data: { id: pickupId } }),
  });

  const claimMutation = useMutation({
    mutationFn: () => claimPickup({ data: { id: pickupId } }),
    onSuccess: () => {
      toast.success("Task assigned to you! You can now start the pickup run.");
      queryClient.invalidateQueries({ queryKey: ["pickup", pickupId] });
      queryClient.invalidateQueries({ queryKey: ["availablePickups"] });
      queryClient.invalidateQueries({ queryKey: ["myPickups"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to claim task");
    },
  });

  const advanceMutation = useMutation({
    mutationFn: (nextStatus: "picked_up" | "delivered") =>
      updatePickupStatus({ data: { id: pickupId, status: nextStatus } }),
    onSuccess: (_, nextStatus) => {
      if (nextStatus === "picked_up") {
        toast.success("Food picked up! Head to the recipient NGO to complete drop-off.");
      } else {
        toast.success("Delivery completed! Thank you for reducing edible food waste! 🎉");
      }
      queryClient.invalidateQueries({ queryKey: ["pickup", pickupId] });
      queryClient.invalidateQueries({ queryKey: ["myPickups"] });
      queryClient.invalidateQueries({ queryKey: ["volunteerStats"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to advance pickup status");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !pickup) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pickup not found"
          description={`Could not find a pickup task with reference ${pickupId}`}
          actions={
            <Button asChild variant="outline">
              <Link to="/volunteer/pickups">
                <ArrowLeft className="size-4" />
                Back to marketplace
              </Link>
            </Button>
          }
        />
        <Card className="border-border/70 p-6 text-center">
          <p className="text-muted-foreground">This pickup assignment may have been completed or removed.</p>
        </Card>
      </div>
    );
  }

  const donation = pickup.donation;
  const ngo = pickup.ngo;
  const isMyAssignment = pickup.volunteer_id === user?.id;
  const isOpen = pickup.status === "open" && !pickup.volunteer_id;

  const steps = [
    { title: "Claimed", done: ["assigned", "picked_up", "delivered"].includes(pickup.status) },
    { title: "Picked Up", done: ["picked_up", "delivered"].includes(pickup.status) },
    { title: "Delivered", done: pickup.status === "delivered" },
  ];

  const mapsPickupUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickup.pickup_location)}`;
  const mapsDropUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickup.delivery_location)}`;

  return (
    <>
      <PageHeader
        title={donation?.food_name || "Food Collection Task"}
        description={`Pickup Task Reference: ${pickup.id}`}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/volunteer/pickups">
                <ArrowLeft className="size-4" />
                All Pickups
              </Link>
            </Button>
          </div>
        }
      />

      {/* Main Delivery Workflow Banner */}
      <Card className="border-primary/40 bg-card shadow-[var(--shadow-card)] mb-6">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="size-5 text-primary" />
              Delivery Progress
            </CardTitle>
            <CardDescription>
              Live stages from kitchen collection to NGO drop-off
            </CardDescription>
          </div>
          <StatusBadge status={pickup.status} className="px-3 py-1 text-sm font-semibold" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-2">
            {steps.map((step, idx) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div
                  className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step.done
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.done ? <CheckCircle2 className="size-4" /> : idx + 1}
                </div>
                <span className="text-xs font-semibold mt-2">{step.title}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Action Control Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/60">
            <div>
              {isOpen ? (
                <>
                  <p className="font-semibold text-sm text-foreground">Task is open for claiming</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click "Claim Assignment" to register yourself as the courier for this delivery run.
                  </p>
                </>
              ) : isMyAssignment && pickup.status === "assigned" ? (
                <>
                  <p className="font-semibold text-sm text-foreground">Step 1: Collect Food from Donor</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Head to the pickup location. Once you have the food package, click "Confirm Picked Up".
                  </p>
                </>
              ) : isMyAssignment && pickup.status === "picked_up" ? (
                <>
                  <p className="font-semibold text-sm text-foreground">Step 2: En Route to Recipient NGO</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Transport the food safely to the NGO facility. Upon arrival, click "Confirm Delivered".
                  </p>
                </>
              ) : pickup.status === "delivered" ? (
                <>
                  <p className="font-semibold text-sm text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" /> Delivery Completed Successfully!
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Delivered on {new Date(pickup.delivered_at || pickup.updated_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-sm text-foreground">Assigned to another courier</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This task is currently being handled by {pickup.volunteer?.full_name || "a volunteer"}.
                  </p>
                </>
              )}
            </div>

            <div className="shrink-0">
              {isOpen && (
                <Button
                  variant="hero"
                  disabled={claimMutation.isPending}
                  onClick={() => claimMutation.mutate()}
                >
                  {claimMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <Truck className="size-4 mr-2" />
                  )}
                  Claim Assignment
                </Button>
              )}

              {isMyAssignment && pickup.status === "assigned" && (
                <Button
                  variant="hero"
                  disabled={advanceMutation.isPending}
                  onClick={() => advanceMutation.mutate("picked_up")}
                >
                  {advanceMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <Package className="size-4 mr-2" />
                  )}
                  Confirm Picked Up
                </Button>
              )}

              {isMyAssignment && pickup.status === "picked_up" && (
                <Button
                  variant="hero"
                  className="bg-emerald-600 hover:bg-emerald-500"
                  disabled={advanceMutation.isPending}
                  onClick={() => advanceMutation.mutate("delivered")}
                >
                  {advanceMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="size-4 mr-2" />
                  )}
                  Confirm Delivered
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Navigation & Contact Cards */}
        <div className="space-y-6">
          {/* Pickup Step */}
          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  1. Donor Collection Address
                </CardTitle>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <a href={mapsPickupUrl} target="_blank" rel="noopener noreferrer">
                    Open in Maps
                    <ExternalLink className="size-3 ml-1" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-sm font-medium text-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                {pickup.pickup_location}
              </p>

              {donation?.available_until && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-3.5 text-amber-600" />
                  <span>Must be collected by: <strong>{new Date(donation.available_until).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}</strong></span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Step */}
          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Navigation className="size-4 text-emerald-600" />
                  2. Recipient NGO Facility
                </CardTitle>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <a href={mapsDropUrl} target="_blank" rel="noopener noreferrer">
                    Open in Maps
                    <ExternalLink className="size-3 ml-1" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-sm font-medium text-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                {pickup.delivery_location}
              </p>

              <div className="rounded-lg bg-card border border-border/70 p-3 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Building2 className="size-3.5 text-primary" />
                  {ngo?.organization_name || "Partner NGO"}
                </div>
                {ngo?.contact_person && (
                  <p className="text-muted-foreground">
                    Contact person: {ngo.contact_person}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Food Specs & Handling */}
        <div className="space-y-6">
          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Food Specifications</CardTitle>
              <CardDescription>Portion sizing and transport safety</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {donation && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/40 space-y-0.5">
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <Package className="size-3.5" /> Quantity
                    </span>
                    <p className="font-bold text-sm text-foreground">
                      {donation.quantity} {donation.quantity_unit}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 space-y-0.5">
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <Utensils className="size-3.5" /> Servings
                    </span>
                    <p className="font-bold text-sm text-foreground">
                      ~{donation.servings} meals
                    </p>
                  </div>
                </div>
              )}

              {donation?.storage_method && (
                <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center gap-2">
                  <Thermometer className="size-4 text-primary" />
                  <div>
                    <span className="font-semibold text-foreground capitalize">
                      {donation.storage_method} storage
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Maintain recommended container closure during transit.
                    </p>
                  </div>
                </div>
              )}

              {donation?.allergens && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 text-amber-900 dark:text-amber-300 flex items-start gap-2">
                  <ShieldAlert className="size-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-semibold">Allergen Notice: </span>
                    {donation.allergens}
                  </div>
                </div>
              )}

              {donation?.description && (
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Donor notes:</span>
                  <p className="p-2.5 rounded-lg bg-muted/30 text-foreground">
                    {donation.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
