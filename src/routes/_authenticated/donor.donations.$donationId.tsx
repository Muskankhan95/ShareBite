import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Package,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Loader2,
  Utensils,
  Thermometer,
  Building2,
  Check,
  X,
  Phone,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calculateFoodUrgency, calculateNgoMatch } from "@/lib/ai-matcher";
import {
  getDonation,
  cancelDonation,
  listDonationRequests,
  approveFoodRequest,
  declineFoodRequest,
} from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/donor/donations/$donationId")({
  head: () => ({
    meta: [
      { title: "Donation Details — ShareBite" },
      { name: "description", content: "View lifecycle and pickup details for your surplus food donation." },
    ],
  }),
  component: DonationDetails,
});

function DonationDetails() {
  const { donationId } = useParams({ from: "/_authenticated/donor/donations/$donationId" });
  const queryClient = useQueryClient();

  const { data: donation, isLoading, error } = useQuery({
    queryKey: ["donation", donationId],
    queryFn: () => getDonation({ data: { id: donationId } }),
  });

  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ["donationRequests", donationId],
    queryFn: () => listDonationRequests({ data: { donationId } }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelDonation({ data: { id: donationId } }),
    onSuccess: () => {
      toast.success("Donation cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["donation", donationId] });
      queryClient.invalidateQueries({ queryKey: ["myDonations"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to cancel donation");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => approveFoodRequest({ data: { requestId } }),
    onSuccess: () => {
      toast.success("Request approved! A volunteer courier pickup order has been published.");
      queryClient.invalidateQueries({ queryKey: ["donation", donationId] });
      queryClient.invalidateQueries({ queryKey: ["donationRequests", donationId] });
      queryClient.invalidateQueries({ queryKey: ["myDonations"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to approve request");
    },
  });

  const declineMutation = useMutation({
    mutationFn: (requestId: string) => declineFoodRequest({ data: { requestId } }),
    onSuccess: () => {
      toast.info("Request declined.");
      queryClient.invalidateQueries({ queryKey: ["donationRequests", donationId] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to decline request");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Donation not found"
          description={`Could not find a donation record for reference ${donationId}`}
          actions={
            <Button asChild variant="outline">
              <Link to="/donor/donations">
                <ArrowLeft className="size-4" />
                Back to donations
              </Link>
            </Button>
          }
        />
        <Card className="border-border/70 p-6 text-center">
          <p className="text-muted-foreground">This donation may have been deleted or does not exist.</p>
        </Card>
      </div>
    );
  }

  const isCancellable = ["available", "requested"].includes(donation.status);

  // Status timeline steps
  const steps = [
    { title: "Listed", done: true, desc: new Date(donation.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    { title: "NGO Accepted", done: ["accepted", "in_transit", "delivered"].includes(donation.status), desc: donation.status === "requested" ? "Requested" : "Awaiting" },
    { title: "Volunteer Pickup", done: ["in_transit", "delivered"].includes(donation.status), desc: "In transit" },
    { title: "Delivered", done: donation.status === "delivered", desc: "Completed" },
  ];

  return (
    <>
      <PageHeader
        title={donation.food_name}
        description={`Reference: ${donation.id}`}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/donor/donations">
                <ArrowLeft className="size-4" />
                Back to list
              </Link>
            </Button>
            {isCancellable ? (
              <Button
                variant="destructive"
                disabled={cancelMutation.isPending}
                onClick={() => {
                  if (confirm("Are you sure you want to cancel this surplus food listing?")) {
                    cancelMutation.mutate();
                  }
                }}
              >
                <Ban className="size-4" />
                Cancel donation
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Status & Lifecycle Timeline */}
          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Redistribution Progress</CardTitle>
                <CardDescription>Live tracking from donor kitchen to recipient NGO</CardDescription>
              </div>
              <StatusBadge status={donation.status} className="text-sm px-3 py-1" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-4 gap-2 pt-2">
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
            </CardContent>
          </Card>

          {/* Incoming NGO Requests */}
          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="size-5 text-primary" />
                  NGO Requests for this Food
                </CardTitle>
                <CardDescription>
                  Partner organizations requesting to receive this surplus batch
                </CardDescription>
              </div>
              {requests.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {requests.length} {requests.length === 1 ? "request" : "requests"}
                </span>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
                  <Building2 className="size-8 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-medium text-foreground">No NGO requests yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    When verified NGOs in your area request this donation, their proposal and drop-off facility will appear here for you to approve.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req: any) => {
                    const urgency = calculateFoodUrgency(donation.available_until, donation.storage_method);
                    const match = calculateNgoMatch(
                      donation.servings,
                      req.ngo?.capacity,
                      req.ngo?.verificationStatus === "verified",
                      urgency.score
                    );

                    return (
                    <div
                      key={req.id}
                      className="rounded-xl border border-border/70 p-4 transition-all bg-card hover:border-primary/40 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground text-sm">
                              {req.ngo?.name}
                            </p>
                            {req.ngo?.verificationStatus === "verified" && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <Check className="size-3" /> Verified NGO
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              <Sparkles className="size-2.5" /> {match.matchScore}% AI Match
                            </span>
                          </div>
                          {req.ngo?.contactPerson && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Contact: {req.ngo.contactPerson} {req.ngo?.phone ? `• ${req.ngo.phone}` : ""}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Drop-off facility: {req.ngo?.address}
                          </p>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>

                      <div className="rounded-lg bg-muted/40 p-2.5 text-xs text-foreground/90 space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Requested quantity:</span>
                          <span className="text-primary font-semibold">
                            {req.requested_quantity} {donation.quantity_unit}
                          </span>
                        </div>
                        {req.note && (
                          <div className="pt-1 text-muted-foreground flex items-start gap-1.5">
                            <MessageSquare className="size-3.5 shrink-0 mt-0.5 text-primary/70" />
                            <span>"{req.note}"</span>
                          </div>
                        )}
                      </div>

                      {req.status === "pending" && donation.status !== "delivered" && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            disabled={declineMutation.isPending || approveMutation.isPending}
                            onClick={() => declineMutation.mutate(req.id)}
                          >
                            <X className="size-3.5 mr-1" />
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            disabled={approveMutation.isPending || declineMutation.isPending}
                            onClick={() => approveMutation.mutate(req.id)}
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="size-3.5 animate-spin mr-1" />
                            ) : (
                              <Check className="size-3.5 mr-1" />
                            )}
                            Approve Request & Dispatch
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Food Details */}
          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-lg">Food Specifications</CardTitle>
              <CardDescription>Portion sizing and handling conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="size-3.5" />
                    Quantity
                  </span>
                  <p className="font-semibold">{donation.quantity} {donation.quantity_unit}</p>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Utensils className="size-3.5" />
                    Servings
                  </span>
                  <p className="font-semibold">{donation.servings} meals</p>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Thermometer className="size-3.5" />
                    Storage
                  </span>
                  <p className="font-semibold capitalize">{donation.storage_method}</p>
                </div>
              </div>

              {donation.description ? (
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-semibold text-muted-foreground">Notes & Handling:</span>
                  <p className="text-sm bg-muted/20 p-3 rounded-lg border border-border/50">
                    {donation.description}
                  </p>
                </div>
              ) : null}

              {donation.allergens ? (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-300">
                  <ShieldAlert className="size-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-semibold">Dietary & Allergen Notes: </span>
                    {donation.allergens}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Location & Windows */}
        <div className="space-y-6">
          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-lg">Pickup Window & Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="size-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">Pickup Location</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {donation.pickup_address}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Clock className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">Available Until</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(donation.available_until).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {donation.preparation_time ? (
                <div className="flex items-start gap-3">
                  <Calendar className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">Preparation Time</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(donation.preparation_time).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
