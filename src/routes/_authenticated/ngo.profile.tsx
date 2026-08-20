import { createFileRoute } from "@tanstack/react-router";
import { ProfileScreen } from "@/components/dashboard/profile-screen";

export const Route = createFileRoute("/_authenticated/_authenticated/ngo/profile")({
  component: () => (
    <ProfileScreen
      role="ngo"
      extraFields={[
        { id: "organization", label: "Organization name", placeholder: "Anna Seva Trust" },
        { id: "registration", label: "Registration number", placeholder: "NGO-2024-00123" },
        { id: "capacity", label: "Daily serving capacity", placeholder: "250" },
      ]}
    />
  ),
});
