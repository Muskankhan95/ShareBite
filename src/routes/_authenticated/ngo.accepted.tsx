import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Handshake,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  User,
  Utensils,
  Package,
  Loader2,
  Navigation,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { listNgoAccepted } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/ngo/accepted")({
  head: () => ({
    meta: [
      { title: "Accepted Donations & Deliveries — ShareBite" },
      { name: "description", content: "Track live courier delivery and pickup status for approved food batches." },
    ],
  }),
  component: AcceptedDonations,
});

function AcceptedDonations() {
  const { data: pickups = [], isLoading } = useQuery({
    queryKey: ["ngoAcceptedPickups"],
    queryFn: () => listNgoAccepted(),
    refetchInterval: 15000,
  });

  return (
    <>
      <PageHeader
        title="Accepted Donations"
        description="Active food donations approved by donors and currently awaiting courier pickup or en route to your facility."
        actions={
          <Button asChild variant="hero">
            <Link to="/ngo/nearby">
              <MapPin className="size-4" />
              Find More Food
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : pickups.length === 0 ? (
        <Card className="border-border/70 p-12 text-center shadow-[var(--shadow-card)]">
          <div className="size-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <Handshake className="size-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No active incoming deliveries</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Once a food donor accepts one of your requests, the volunteer pickup task will be created and tracked here.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/ngo/requests">View Open Requests</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {pickups.map((item) => {
            const donation = item.donation;
            const volunteer = item.volunteer;

            // Delivery stage timeline
            const steps = [
              {
                title: "Approved",
                done: true,
                desc: "Donor accepted",
              },
              {
                title: "Courier Assigned",
                done: ["assigned", "picked_up", "delivered"].includes(item.status),
                desc: volunteer ? volunteer.full_name : "Waiting for volunteer",
              },
              {
                title: "In Transit",
                done: ["picked_up", "delivered"].includes(item.status),
                desc: item.picked_up_at ? "Picked up" : "En route to donor",
              },
              {
                title: "Delivered",
                done: item.status === "delivered",
                desc: "Arrived at NGO",
              },
            ];

            return (
              <Card
                key={item.id}
                className="border-border/70 shadow-[var(--shadow-card)] overflow-hidden"
              >
                <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold">
                          {donation?.food_name || "Surplus Food Package"}
                        </CardTitle>
                        <StatusBadge status={item.status} />
                      </div>
                      <CardDescription className="text-xs">
                        Task Reference: {item.id} • Accepted on {new Date(item.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-3">
                      {donation && (
                        <div className="text-right">
                          <p className="font-bold text-foreground text-sm">
                            {donation.quantity} {donation.quantity_unit} (~{donation.servings} meals)
                          </p>
                          <p className="text-[11px] text-muted-foreground capitalize">
                            Storage: {donation.storage_method}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Progress Tracker */}
                  <div className="grid grid-cols-4 gap-2">
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
                        <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {step.desc}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="grid gap-6 md:grid-cols-2 text-sm">
                    {/* Routing Details */}
                    <div className="space-y-3">
                      <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                        Logistics Route
                      </p>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="size-3.5 text-primary" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">Pickup Location (Donor)</span>
                            <p className="text-muted-foreground mt-0.5">{item.pickup_location}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="size-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Navigation className="size-3.5 text-emerald-600" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">Delivery Facility (Your NGO)</span>
                            <p className="text-muted-foreground mt-0.5">{item.delivery_location}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Volunteer Courier Info */}
                    <div className="space-y-3">
                      <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                        Assigned Courier
                      </p>

                      {volunteer ? (
                        <div className="rounded-xl border border-border/70 p-3.5 bg-card space-y-2">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="size-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm">{volunteer.full_name}</p>
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                                <CheckCircle2 className="size-3" /> Registered Volunteer
                              </span>
                            </div>
                          </div>

                          {volunteer.phone && (
                            <div className="flex items-center gap-2 text-xs pt-1 border-t border-border/50 text-muted-foreground">
                              <Phone className="size-3.5 text-primary" />
                              <span>{volunteer.phone}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/70 p-4 text-center bg-muted/20">
                          <Truck className="size-6 mx-auto text-muted-foreground animate-bounce mb-1" />
                          <p className="text-xs font-semibold text-foreground">Looking for a nearby volunteer courier</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Volunteers in the area have been notified and can claim this pickup.
                          </p>
                        </div>
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
