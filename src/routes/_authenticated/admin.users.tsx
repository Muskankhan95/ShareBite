import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ListScreen } from "@/components/dashboard/list-screen";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  return (
    <ListScreen
      title="Users"
      description="Everyone registered on the platform, across all four roles."
      emptyTitle="No users to display"
      emptyDescription="Registered donors, NGOs, volunteers and admins will be listed here."
      emptyIcon={Users}
      feature="User management"
      planned={[
        "Search and role filters",
        "Suspend or reactivate accounts",
        "Role assignment (stored separately from profiles)",
        "Activity audit trail",
      ]}
    >
      <div className="space-y-3">
        <Input placeholder="Search by name, email or city" disabled />
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="donor">Donors</TabsTrigger>
            <TabsTrigger value="ngo">NGOs</TabsTrigger>
            <TabsTrigger value="volunteer">Volunteers</TabsTrigger>
            <TabsTrigger value="admin">Admins</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </ListScreen>
  );
}
