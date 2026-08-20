import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ClipboardList, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/states";
import { NotImplementedPanel } from "@/components/common/not-implemented-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <>
      <PageHeader
        title="Admin dashboard"
        description="Platform health, verification queue and moderation at a glance."
        actions={
          <Button asChild variant="hero">
            <Link to="/admin/ngos">
              <ShieldCheck />
              Verification queue
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value="—" hint="All roles" icon={Users} />
        <StatCard label="Pending NGOs" value="—" hint="Awaiting verification" icon={Building2} />
        <StatCard label="Donations today" value="—" hint="Listed in last 24h" icon={ClipboardList} />
        <StatCard label="Deliveries today" value="—" hint="Completed runs" icon={ShieldCheck} />
      </section>

      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-lg">Verification queue</CardTitle>
          <CardDescription>Organizations waiting for a decision.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Nothing to review"
            description="NGO applications will appear here with their documents once registration is live."
            icon={Building2}
          />
        </CardContent>
      </Card>

      <NotImplementedPanel
        feature="Admin dashboard metrics"
        planned={[
          "Platform-wide counters",
          "Verification queue actions",
          "Flagged donation alerts",
          "Daily activity feed",
        ]}
      />
    </>
  );
}
