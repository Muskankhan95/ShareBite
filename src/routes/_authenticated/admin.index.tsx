import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ClipboardList,
  ShieldCheck,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Check,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardStats, listAdminNgos } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Overview — ShareBite" },
      { name: "description", content: "Platform analytics, verification queue, and user operations." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => getAdminDashboardStats(),
    refetchInterval: 30000,
  });

  const { data: ngos = [], isLoading: isLoadingNgos } = useQuery({
    queryKey: ["adminNgos"],
    queryFn: () => listAdminNgos(),
  });

  const pendingNgos = ngos.filter((n) => n.verification_status === "pending").slice(0, 3);

  return (
    <>
      <PageHeader
        title="Admin Control Center"
        description="Monitor system health, verify partner organizations, and oversee food rescue operations."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/users">
                <Users className="size-4" />
                Manage Users
              </Link>
            </Button>
            <Button asChild variant="hero">
              <Link to="/admin/ngos">
                <ShieldCheck className="size-4" />
                Verification Queue
              </Link>
            </Button>
          </div>
        }
      />

      {/* Analytics Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          label="Total Users"
          value={isLoadingStats ? "..." : String(stats?.totalUsers ?? 0)}
          hint="Across all 4 roles"
          icon={Users}
        />
        <StatCard
          label="Pending NGOs"
          value={isLoadingStats ? "..." : String(stats?.pendingNgos ?? 0)}
          hint="Awaiting admin decision"
          icon={Building2}
        />
        <StatCard
          label="Donations Today"
          value={isLoadingStats ? "..." : String(stats?.donationsToday ?? 0)}
          hint="Listed in past 24h"
          icon={ClipboardList}
        />
        <StatCard
          label="Deliveries Today"
          value={isLoadingStats ? "..." : String(stats?.deliveriesToday ?? 0)}
          hint="Completed courier runs"
          icon={CheckCircle2}
        />
      </section>

      {/* Verification Queue Preview */}
      <Card className="border-border/70 shadow-[var(--shadow-card)] mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Organizations Awaiting Review</CardTitle>
            <CardDescription>
              New NGO registrations requiring credential verification before receiving donations.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/ngos">
              View All ({stats?.pendingNgos ?? 0})
              <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingNgos ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : pendingNgos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
              <CheckCircle2 className="size-8 mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-foreground">Queue is clear!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All registered organizations have been reviewed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingNgos.map((ngo) => (
                <div
                  key={ngo.id}
                  className="rounded-xl border border-border/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-foreground">{ngo.organization_name}</p>
                      <StatusBadge status="pending" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Contact: {ngo.contact_person || "Designated Representative"} • Facility: {ngo.address}
                    </p>
                  </div>

                  <Button asChild size="sm" variant="hero">
                    <Link to="/admin/ngos">
                      Review & Approve
                      <ArrowRight className="size-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
