import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/layout/role-gate";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Workspace — ShareBite" },
      {
        name: "description",
        content: "Verify NGOs, manage users and donations, and review platform reports.",
      },
      { property: "og:title", content: "Admin Workspace — ShareBite" },
      { property: "og:description", content: "Operate and moderate the ShareBite platform." },
    ],
  }),
  component: () => <RoleGate role="admin" />,
});
