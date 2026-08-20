import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const Route = createFileRoute("/donor")({
  head: () => ({
    meta: [
      { title: "Donor Workspace — FoodRescue" },
      {
        name: "description",
        content: "Create donations, track pickups and review your food donation history.",
      },
      { property: "og:title", content: "Donor Workspace — FoodRescue" },
      { property: "og:description", content: "Manage your surplus food donations." },
    ],
  }),
  component: () => <DashboardShell role="donor" />,
});
