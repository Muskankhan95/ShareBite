import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  PackagePlus,
  Calendar,
  MapPin,
  Clock,
  Search,
  ArrowRight,
  Ban,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listMyDonations, cancelDonation } from "@/lib/data.functions";
import type { FoodDonation } from "@/types";

export const Route = createFileRoute("/_authenticated/donor/donations/")({
  head: () => ({
    meta: [
      { title: "My Surplus Food Donations — ShareBite" },
      { name: "description", content: "Manage your active and completed food donation listings." },
    ],
  }),
  component: MyDonations,
});

function formatExpiry(isoDate: string): { label: string; isExpired: boolean } {
  const diffHours = (new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60);
  if (diffHours < 0) {
    return { label: "Expired", isExpired: true };
  }
  if (diffHours < 1) {
    const mins = Math.max(1, Math.round(diffHours * 60));
    return { label: `Expires in ${mins}m`, isExpired: false };
  }
  if (diffHours < 24) {
    return { label: `Expires in ${Math.round(diffHours)}h`, isExpired: false };
  }
  const dateStr = new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return { label: `Until ${dateStr}`, isExpired: false };
}

function MyDonations() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: donations = [], isLoading, error } = useQuery({
    queryKey: ["myDonations"],
    queryFn: () => listMyDonations(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelDonation({ data: { id } }),
    onSuccess: () => {
      toast.success("Donation cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["myDonations"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to cancel donation");
    },
  });

  const filtered = donations.filter((item) => {
    // Tab filter
    if (activeTab === "available" && item.status !== "available") return false;
    if (activeTab === "in_progress" && !["requested", "accepted", "in_transit"].includes(item.status))
      return false;
    if (activeTab === "delivered" && item.status !== "delivered") return false;
    if (activeTab === "cancelled" && item.status !== "cancelled") return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.food_name.toLowerCase().includes(q);
      const matchAddress = item.pickup_address.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      return matchName || matchAddress || matchCategory;
    }
    return true;
  });

  return (
    <>
      <PageHeader
        title="My Food Donations"
        description="Every donation you have listed with its pickup window, matched organization, and delivery progress."
        actions={
          <Button asChild variant="hero">
            <Link to="/donor/donations/new">
              <PackagePlus className="size-4" />
              Create donation
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-5 w-full sm:w-auto">
            <TabsTrigger value="all">All ({donations.length})</TabsTrigger>
            <TabsTrigger value="available">
              Active ({donations.filter((d) => d.status === "available").length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">In Transit</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search donations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="border-destructive/30 p-6 text-center">
          <p className="text-destructive font-medium">Failed to load donations.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["myDonations"] })}
          >
            Retry
          </Button>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No matching donations" : "No donations in this category"}
          description={
            searchQuery
              ? `No listings matched "${searchQuery}". Try a different keyword.`
              : "When you list surplus food, it will appear here with live progress tracking."
          }
          icon={Package}
          action={
            <Button asChild variant="hero" size="sm">
              <Link to="/donor/donations/new">List food now</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const expiry = formatExpiry(item.available_until);
            return (
              <Card
                key={item.id}
                className="flex flex-col justify-between border-border/70 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="capitalize text-xs">
                      {item.category}
                    </Badge>
                    <StatusBadge status={item.status} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base line-clamp-1 text-foreground">
                      {item.food_name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity} {item.quantity_unit} • {item.servings} meals/servings
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2.5 text-xs text-muted-foreground pb-4">
                  <div className="flex items-center gap-1.5">
                    <Clock
                      className={`size-3.5 shrink-0 ${
                        expiry.isExpired ? "text-destructive" : "text-amber-600"
                      }`}
                    />
                    <span className={expiry.isExpired ? "font-semibold text-destructive" : ""}>
                      {expiry.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 line-clamp-1">
                    <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{item.pickup_address}</span>
                  </div>

                  {item.allergens ? (
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-md line-clamp-1">
                      {item.allergens}
                    </div>
                  ) : null}
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                  {item.status === "available" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 h-8 px-2.5"
                      disabled={cancelMutation.isPending}
                      onClick={() => {
                        if (confirm(`Are you sure you want to cancel "${item.food_name}"?`)) {
                          cancelMutation.mutate(item.id);
                        }
                      }}
                    >
                      <Ban className="size-3.5 mr-1" />
                      Cancel
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {item.storage_method}
                    </span>
                  )}

                  <Button asChild variant="outline" size="sm" className="h-8 gap-1 ml-auto">
                    <Link to="/donor/donations/$donationId" params={{ donationId: item.id }}>
                      View details
                      <ArrowRight className="size-3" />
                    </Link>
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
