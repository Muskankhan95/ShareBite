import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const Route = createFileRoute("/_authenticated/volunteer")({
  head: () => ({
    meta: [
      { title: "Volunteer Workspace — FoodRescue" },
      {
        name: "description",
        content: "Accept nearby pickups, deliver food to NGOs and track your delivery history.",
      },
      { property: "og:title", content: "Volunteer Workspace — FoodRescue" },
      { property: "og:description", content: "Pick up and deliver rescued food." },
    ],
  }),
  component: () => <DashboardShell role="volunteer" />,
});
