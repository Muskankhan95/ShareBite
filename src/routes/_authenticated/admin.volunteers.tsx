import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Truck,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  User,
  ShieldCheck,
  Award,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAdminUsers } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/admin/volunteers")({
  head: () => ({
    meta: [
      { title: "Volunteer Network — ShareBite Admin" },
      { name: "description", content: "Volunteer couriers, active delivery runs, and performance oversight." },
    ],
  }),
  component: AdminVolunteers,
});

function AdminVolunteers() {
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => listAdminUsers(),
  });

  const volunteers = useMemo(() => {
    return users.filter((u: any) => {
      const roles: string[] = (u.user_roles ?? []).map((r: any) => r.role);
      if (!roles.includes("volunteer")) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = u.full_name?.toLowerCase().includes(q) ?? false;
        const phoneMatch = u.phone?.toLowerCase().includes(q) ?? false;
        const addrMatch = u.address?.toLowerCase().includes(q) ?? false;
        return nameMatch || phoneMatch || addrMatch;
      }
      return true;
    });
  }, [users, search]);

  return (
    <>
      <PageHeader
        title="Volunteer Courier Network"
        description="Monitor registered community couriers, availability coverage, and delivery performance."
        actions={
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {volunteers.length} Active Couriers
            </span>
          </div>
        }
      />

      <div className="relative sm:w-80 mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by volunteer name, area, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : volunteers.length === 0 ? (
        <Card className="border-border/70 p-12 text-center shadow-[var(--shadow-card)]">
          <div className="size-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <Truck className="size-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No volunteers registered yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {search.trim()
              ? "No volunteers match your search filter."
              : "When users sign up with the Volunteer role, they will be listed here with their delivery metrics."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {volunteers.map((vol: any) => (
            <Card
              key={vol.id}
              className="border-border/70 shadow-[var(--shadow-card)] hover:border-primary/40 transition-all"
            >
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{vol.full_name}</span>
                    <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      Courier
                    </Badge>
                    <StatusBadge status={vol.status || "active"} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {vol.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3" />
                        {vol.phone}
                      </span>
                    )}
                    {vol.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        Base area: {vol.address}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      Registered {new Date(vol.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <Award className="size-3.5" />
                    Verified Courier
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
