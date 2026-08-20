import { createFileRoute } from "@tanstack/react-router";
import { ProfileScreen } from "@/components/dashboard/profile-screen";

export const Route = createFileRoute("/donor/profile")({
  component: () => (
    <ProfileScreen
      role="donor"
      extraFields={[
        { id: "donorType", label: "Donor type", placeholder: "Restaurant" },
        { id: "organization", label: "Organization", placeholder: "Green Leaf Restaurant" },
      ]}
    />
  ),
});
