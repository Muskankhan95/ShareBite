import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  Search,
  MapPin,
  Clock,
  Utensils,
  Package,
  User,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { listAdminDonations } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/admin/donations")({
  head: () => ({
    meta: [
      { title: "Platform Donations — ShareBite Admin" },
      { name: "description", content: "Comprehensive oversight of all surplus food donations across the platform." },
    ],
  }),
  component: AdminDonations,
});

function AdminDonations() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["adminDonations"],
    queryFn: () => listAdminDonations(),
  });

  const filteredDonations = useMemo(() => {
    return donations.filter((d: any) => {
      if (activeTab === "active" && !["available", "requested", "accepted", "in_transit"].includes(d.status)) {
        return false;
      }
      if (activeTab === "delivered" && d.status !== "delivered") return false;
      if (activeTab === "cancelled" && d.status !== "cancelled") return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const foodMatch = d.food_name.toLowerCase().includes(q);
        const donorMatch = d.profiles?.full_name?.toLowerCase().includes(q) ?? false;
        const orgMatch = d.profiles?.organization_name?.toLowerCase().includes(q) ?? false;
        const addressMatch = d.pickup_address.toLowerCase().includes(q);
        return foodMatch || donorMatch || orgMatch || addressMatch;
      }

      return true;
    });
  }, [donations, activeTab, search]);

  const counts = useMemo(() => {
    const active = donations.filter((d: any) =>
      ["available", "requested", "accepted", "in_transit"].includes(d.status)
    ).length;
    const delivered = donations.filter((d: any) => d.status === "delivered").length;
    const cancelled = donations.filter((d: any) => d.status === "cancelled").length;
    return { all: donations.length, active, delivered, cancelled };
  }, [donations]);

  return (
    <>
      <PageHeader
        title="Donation Oversight"
        description="Comprehensive audit of all surplus food batches published, claimed, and distributed on ShareBite."
        actions={
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {donations.length} Total Listings
            </span>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 sm:w-96">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
            <TabsTrigger value="delivered">Delivered ({counts.delivered})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({counts.cancelled})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by food, donor, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredDonations.length === 0 ? (
        <Card className="border-border/70 p-12 text-center shadow-[var(--shadow-card)]">
          <div className="size-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <ClipboardList className="size-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No donations found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            No donation records match your search criteria.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDonations.map((d: any) => {
            const donor = d.profiles;

            return (
              <Card
                key={d.id}
                className="border-border/70 shadow-[var(--shadow-card)] hover:border-primary/40 transition-all"
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-foreground text-sm">{d.food_name}</h4>
                      <Badge variant="outline" className="capitalize text-[11px]">
                        {d.category}
                      </Badge>
                      <StatusBadge status={d.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Utensils className="size-3.5 text-primary" />
                        {d.servings} meals ({d.quantity} {d.quantity_unit})
                      </span>

                      {donor && (
                        <span className="flex items-center gap-1">
                          <User className="size-3.5" />
                          Donor: {donor.organization_name || donor.full_name}
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        Published {new Date(d.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-0.5">
                      <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{d.pickup_address}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Storage:</p>
                    <p className="text-xs font-semibold text-foreground capitalize">
                      {d.storage_method}
                    </p>
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
