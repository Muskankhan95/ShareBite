import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/layout/role-gate";

export const Route = createFileRoute("/_authenticated/donor")({
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
  component: () => <RoleGate role="donor" />,
});
