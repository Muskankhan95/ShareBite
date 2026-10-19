import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  History,
  CheckCircle2,
  Calendar,
  MapPin,
  Utensils,
  Package,
  User,
  Loader2,
  Soup,
  Scale,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { listNgoHistory } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/ngo/history")({
  head: () => ({
    meta: [
      { title: "Donation History — ShareBite" },
      { name: "description", content: "Historical log of surplus food received and distributed by your NGO." },
    ],
  }),
  component: NgoHistory,
});

function NgoHistory() {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["ngoDeliveryHistory"],
    queryFn: () => listNgoHistory(),
  });

  const totalMeals = history.reduce((acc, curr) => acc + (curr.donation?.servings || 0), 0);
  const totalWeight = history.reduce((acc, curr) => {
    if (curr.donation?.quantity_unit === "kg") {
      return acc + (curr.donation.quantity || 0);
    }
    return acc;
  }, 0);

  return (
    <>
      <PageHeader
        title="Donation History"
        description="Every completed food delivery received and redistributed by your organization."
        actions={
          <Button asChild variant="hero">
            <Link to="/ngo/nearby">Find Nearby Food</Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard
          label="Total Deliveries"
          value={isLoading ? "..." : String(history.length)}
          hint="Completed food rescue tasks"
          icon={CheckCircle2}
        />
        <StatCard
          label="Meals Received"
          value={isLoading ? "..." : String(totalMeals)}
          hint="Portions served to community"
          icon={Soup}
        />
        <StatCard
          label="Food Rescued"
          value={isLoading ? "..." : `${totalWeight.toFixed(1)} kg`}
          hint="Weight of rescued edible food"
          icon={Scale}
        />
      </section>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : history.length === 0 ? (
        <Card className="border-border/70 p-12 text-center shadow-[var(--shadow-card)]">
          <div className="size-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <History className="size-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No delivered donations yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Once a volunteer courier delivers an accepted food batch to your facility, it will be permanently archived here.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/ngo/nearby">Discover Available Food</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const donation = item.donation;
            const volunteer = item.volunteer;

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
                          {donation?.food_name || "Surplus Food"}
                        </h4>
                        <StatusBadge status="delivered" />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Utensils className="size-3.5 text-primary" />
                          {donation?.servings || 0} meals distributed
                        </span>

                        {donation?.quantity && (
                          <span className="flex items-center gap-1">
                            <Package className="size-3.5" />
                            {donation.quantity} {donation.quantity_unit}
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          Delivered on {new Date(item.delivered_at || item.updated_at).toLocaleDateString([], {
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

                        {volunteer && (
                          <div className="flex items-center gap-1.5">
                            <User className="size-3.5 text-primary shrink-0" />
                            <span>Courier: {volunteer.full_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                        Completed & Verified
                      </span>
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
