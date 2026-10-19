import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Inbox,
  Clock,
  MapPin,
  Utensils,
  Ban,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listMyRequests, cancelFoodRequest } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/ngo/requests")({
  head: () => ({
    meta: [
      { title: "Food Requests — ShareBite" },
      { name: "description", content: "Track requests your organization has submitted to food donors." },
    ],
  }),
  component: FoodRequests,
});

function FoodRequests() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["myNgoRequests"],
    queryFn: () => listMyRequests(),
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => cancelFoodRequest({ data: { requestId } }),
    onSuccess: () => {
      toast.success("Request cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["myNgoRequests"] });
      queryClient.invalidateQueries({ queryKey: ["nearbyDonations"] });
      queryClient.invalidateQueries({ queryKey: ["ngoDashboardStats"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to cancel request");
    },
  });

  const filteredRequests = useMemo(() => {
    if (activeTab === "all") return requests;
    return requests.filter((r) => r.status === activeTab);
  }, [requests, activeTab]);

  const counts = useMemo(() => {
    const p = requests.filter((r) => r.status === "pending").length;
    const a = requests.filter((r) => r.status === "approved").length;
    const d = requests.filter((r) => r.status === "declined").length;
    return { all: requests.length, pending: p, approved: a, declined: d };
  }, [requests]);

  return (
    <>
      <PageHeader
        title="Food Requests"
        description="Monitor status of food batches your organization has requested from local donors."
        actions={
          <Button asChild variant="hero">
            <Link to="/ngo/nearby">
              <MapPin className="size-4" />
              Find More Food
            </Link>
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-4 sm:w-96">
          <TabsTrigger value="all">
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="declined">
            Declined ({counts.declined})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="border-border/70 p-12 text-center shadow-[var(--shadow-card)]">
          <div className="size-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <Inbox className="size-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No {activeTab === "all" ? "" : activeTab} requests found
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {activeTab === "pending"
              ? "You do not have any open requests awaiting donor response."
              : activeTab === "approved"
              ? "No requests have been approved yet. Once a donor accepts, it will appear here."
              : "When you request surplus food from the discovery board, your submissions are tracked here."}
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/ngo/nearby">Browse Available Food</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const donation = req.donation;
            const isPending = req.status === "pending";
            const isApproved = req.status === "approved";

            return (
              <Card
                key={req.id}
                className="border-border/70 shadow-[var(--shadow-card)] hover:border-primary/40 transition-all"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-foreground">
                          {donation?.food_name || "Surplus Food Donation"}
                        </h4>
                        <StatusBadge status={req.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Utensils className="size-3.5 text-primary" />
                          Requested: {req.requested_quantity} {donation?.quantity_unit || "kg"}
                        </span>

                        {donation?.servings && (
                          <span>Total batch: ~{donation.servings} meals</span>
                        )}

                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          Requested on {new Date(req.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {donation?.pickup_address && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3.5 text-primary shrink-0" />
                          <span>Pickup: {donation.pickup_address}</span>
                        </div>
                      )}

                      {req.note && (
                        <div className="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground flex items-start gap-1.5">
                          <MessageSquare className="size-3.5 shrink-0 mt-0.5 text-primary/70" />
                          <span>Your note: "{req.note}"</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isPending && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          disabled={cancelMutation.isPending}
                          onClick={() => {
                            if (confirm("Are you sure you want to cancel this request?")) {
                              cancelMutation.mutate(req.id);
                            }
                          }}
                        >
                          <Ban className="size-3.5 mr-1" />
                          Cancel Request
                        </Button>
                      )}

                      {isApproved && (
                        <Button asChild size="sm" variant="hero">
                          <Link to="/ngo/accepted">
                            <Truck className="size-3.5 mr-1" />
                            Track Pickup
                            <ArrowRight className="size-3.5 ml-1" />
                          </Link>
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
