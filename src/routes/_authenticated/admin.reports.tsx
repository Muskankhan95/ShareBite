import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FileBarChart,
  Soup,
  Scale,
  Building2,
  Users,
  CheckCircle2,
  Download,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getImpactStatistics } from "@/lib/impact.functions";
import { getAdminDashboardStats } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({
    meta: [
      { title: "Platform Reports — ShareBite Admin" },
      { name: "description", content: "Operational and impact summaries across the food rescue ecosystem." },
    ],
  }),
  component: AdminReports,
});

function AdminReports() {
  const { data: impact, isLoading: isLoadingImpact } = useQuery({
    queryKey: ["platformImpact"],
    queryFn: () => getImpactStatistics(),
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => getAdminDashboardStats(),
  });

  const handleExportSummary = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Metric,Value\n" +
      `Meals Rescued,${impact?.mealsRescued ?? 0}\n` +
      `Food Weight Rescued (kg),${impact?.foodWeightRescued ?? 0}\n` +
      `Donations Completed,${impact?.donationsCompleted ?? 0}\n` +
      `Volunteers Involved,${impact?.volunteersInvolved ?? 0}\n` +
      `Organizations Involved,${impact?.organizationsInvolved ?? 0}\n` +
      `Total Users,${stats?.totalUsers ?? 0}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sharebite_impact_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader
        title="Impact & Analytics Reports"
        description="Comprehensive audit of rescued food, partner NGO distributions, and volunteer courier runs."
        actions={
          <Button variant="hero" onClick={handleExportSummary}>
            <Download className="size-4 mr-2" />
            Export Impact CSV
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          label="Meals Rescued"
          value={isLoadingImpact ? "..." : String(impact?.mealsRescued ?? 0)}
          hint="Portions diverted from waste"
          icon={Soup}
        />
        <StatCard
          label="Weight Diverted"
          value={isLoadingImpact ? "..." : `${(impact?.foodWeightRescued ?? 0).toFixed(1)} kg`}
          hint="Kept out of landfills"
          icon={Scale}
        />
        <StatCard
          label="Partner NGOs"
          value={isLoadingImpact ? "..." : String(impact?.organizationsInvolved ?? 0)}
          hint="Verified distribution points"
          icon={Building2}
        />
        <StatCard
          label="Active Couriers"
          value={isLoadingImpact ? "..." : String(impact?.volunteersInvolved ?? 0)}
          hint="Participating couriers"
          icon={Users}
        />
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="border-border/70 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileBarChart className="size-4 text-primary" />
              Surplus Redistribution Report
            </CardTitle>
            <CardDescription>
              Cumulative volume of food rescued across registered restaurants, hotels, and event canteens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Total Completed Donations:</span>
              <span className="font-bold text-foreground">{impact?.donationsCompleted ?? 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Total Servings Distributed:</span>
              <span className="font-bold text-foreground">{impact?.mealsRescued ?? 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Total Rescued Weight:</span>
              <span className="font-bold text-foreground">{(impact?.foodWeightRescued ?? 0).toFixed(1)} kg</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="size-4 text-emerald-600" />
              Community Delivery Network Report
            </CardTitle>
            <CardDescription>
              Ecosystem coverage metrics across non-governmental relief hubs and volunteer transport.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Verified Nonprofits:</span>
              <span className="font-bold text-foreground">{impact?.organizationsInvolved ?? 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Active Volunteers:</span>
              <span className="font-bold text-foreground">{impact?.volunteersInvolved ?? 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Total Registered Users:</span>
              <span className="font-bold text-foreground">{stats?.totalUsers ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
