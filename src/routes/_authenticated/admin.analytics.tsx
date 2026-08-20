import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/states";
import { NotImplementedPanel } from "@/components/common/not-implemented-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

function AdminAnalytics() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Platform trends across donations, organizations and volunteer activity."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Meals rescued" value="—" icon={BarChart3} />
        <StatCard label="Food saved (kg)" value="—" icon={BarChart3} />
        <StatCard label="Avg. pickup time" value="—" icon={BarChart3} />
        <StatCard label="Delivery success rate" value="—" icon={BarChart3} />
      </section>

      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-lg">Donations over time</CardTitle>
          <CardDescription>Trend charts appear once data collection begins.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No data to chart"
            description="Charts intentionally stay empty rather than showing invented numbers."
            icon={BarChart3}
          />
        </CardContent>
      </Card>

      <NotImplementedPanel
        feature="Analytics dashboards"
        planned={[
          "Donation and delivery trend charts",
          "City and role segmentation",
          "Cohort retention for donors",
          "Waste-averted estimates",
        ]}
      />
    </>
  );
}
