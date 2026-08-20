import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const Route = createFileRoute("/_authenticated/_authenticated/ngo")({
  head: () => ({
    meta: [
      { title: "NGO Workspace — FoodRescue" },
      {
        name: "description",
        content: "Find nearby surplus food, request donations and track accepted deliveries.",
      },
      { property: "og:title", content: "NGO Workspace — FoodRescue" },
      { property: "og:description", content: "Request and receive surplus food donations." },
    ],
  }),
  component: () => <DashboardShell role="ngo" />,
});
