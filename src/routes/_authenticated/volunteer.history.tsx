import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  History,
  CheckCircle2,
  Calendar,
  MapPin,
  Utensils,
  Package,
  Building2,
  Loader2,
  Soup,
  Scale,
  Award,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listMyPickups } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/volunteer/history")({
  head: () => ({
    meta: [
      { title: "Delivery History — ShareBite" },
      { name: "description", content: "Archive of all surplus food transport runs completed by you." },
    ],
  }),
  component: DeliveryHistory,
});

function DeliveryHistory() {
  const { data: pickups = [], isLoading } = useQuery({
    queryKey: ["myPickups"],
    queryFn: () => listMyPickups(),
  });

  const completed = pickups.filter((p) => p.status === "delivered");
  const totalMeals = completed.reduce((acc, curr) => acc + (curr.donation?.servings || 0), 0);
  const totalWeight = completed.reduce((acc, curr) => {
    if (curr.donation?.quantity_unit === "kg") {
      return acc + (curr.donation.quantity || 0);
    }
    return acc;
  }, 0);

  return (
    <>
      <PageHeader
        title="Delivery History & Impact"
        description="Every completed courier run and your personal contribution toward eliminating edible food waste."
        actions={
          <Button asChild variant="hero">
            <Link to="/volunteer/pickups">Find New Pickups</Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard
          label="Runs Completed"
          value={isLoading ? "..." : String(completed.length)}
          hint="Completed courier deliveries"
          icon={CheckCircle2}
        />
        <StatCard
          label="Meals Delivered"
          value={isLoading ? "..." : String(totalMeals)}
          hint="Portions delivered to shelters"
          icon={Soup}
        />
        <StatCard
          label="Food Rescued"
          value={isLoading ? "..." : `${totalWeight.toFixed(1)} kg`}
          hint="Weight of rescued provisions"
          icon={Scale}
        />
      </section>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : completed.length === 0 ? (
        <Card className="border-border/70 p-12 text-center shadow-[var(--shadow-card)]">
          <div className="size-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <History className="size-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No completed deliveries yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Once you claim a task and mark it delivered to the recipient NGO, your verified delivery records will appear here.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/volunteer/pickups">Browse Open Pickups</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {completed.map((item) => {
            const donation = item.donation;
            const ngo = item.ngo;

            return (
              <Card
                key={item.id}
                className="border-border/70 shadow-[var(--shadow-card)] hover:border-primary/40 transition-all"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-foreground">
                          {donation?.food_name || "Food Batch"}
                        </h4>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          Delivered
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Utensils className="size-3.5 text-primary" />
                          ~{donation?.servings || 0} meals
                        </span>

                        {donation?.quantity && (
                          <span className="flex items-center gap-1">
                            <Package className="size-3.5" />
                            {donation.quantity} {donation.quantity_unit}
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          Completed on {new Date(item.delivered_at || item.updated_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2 pt-1 text-xs text-muted-foreground">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                          <span>Origin: {item.pickup_location}</span>
                        </div>

                        <div className="flex items-start gap-1.5">
                          <Building2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            Delivered to: {ngo?.organization_name || "Recipient NGO"} ({item.delivery_location})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs font-medium text-primary">
                        <Award className="size-4" />
                        <span>Certified Volunteer Run</span>
                      </div>
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
