import { createFileRoute } from "@tanstack/react-router";
import { ProfileScreen } from "@/components/dashboard/profile-screen";

export const Route = createFileRoute("/volunteer/profile")({
  component: () => (
    <ProfileScreen
      role="volunteer"
      extraFields={[
        { id: "vehicle", label: "Vehicle type", placeholder: "Scooter" },
        { id: "availability", label: "Availability", placeholder: "Weekday evenings" },
      ]}
    />
  ),
});
