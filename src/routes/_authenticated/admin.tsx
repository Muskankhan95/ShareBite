import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Workspace — FoodRescue" },
      {
        name: "description",
        content: "Verify NGOs, manage users and donations, and review platform reports.",
      },
      { property: "og:title", content: "Admin Workspace — FoodRescue" },
      { property: "og:description", content: "Operate and moderate the FoodRescue platform." },
    ],
  }),
  component: () => <DashboardShell role="admin" />,
});
