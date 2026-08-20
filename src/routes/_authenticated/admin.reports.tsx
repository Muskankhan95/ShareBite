import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/states";
import { NotImplementedPanel } from "@/components/common/not-implemented-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/_authenticated/admin/reports")({
  component: AdminReports,
});

const reports = [
  { title: "Monthly rescue report", body: "Donations, deliveries and meals rescued per month." },
  { title: "Organization report", body: "Food received per verified organization." },
  { title: "Volunteer report", body: "Deliveries, distance and reliability by volunteer." },
  { title: "Waste-averted report", body: "Estimated kilograms of food kept out of landfill." },
];

function AdminReports() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Operational and impact reports for the platform and its partners."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.title} className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-lg">{report.title}</CardTitle>
              <CardDescription>{report.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" disabled>
                Generate (not available yet)
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <EmptyState
        title="No reports generated"
        description="Reports become available once donation and delivery data is recorded."
        icon={FileBarChart}
      />

      <NotImplementedPanel
        feature="Reporting engine"
        planned={["Scheduled report emails", "CSV and PDF export", "Custom date ranges", "City breakdowns"]}
      />
    </>
  );
}
