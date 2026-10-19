import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/layout/role-gate";

export const Route = createFileRoute("/_authenticated/ngo")({
  head: () => ({
    meta: [
      { title: "NGO Workspace — ShareBite" },
      {
        name: "description",
        content: "Find nearby surplus food, request donations and track accepted deliveries.",
      },
      { property: "og:title", content: "NGO Workspace — ShareBite" },
      { property: "og:description", content: "Request and receive surplus food donations." },
    ],
  }),
  component: () => <RoleGate role="ngo" />,
});
