import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Search,
  User,
  Building2,
  Truck,
  ShieldCheck,
  Clock,
  Phone,
  MapPin,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { listAdminUsers } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "User Directory — ShareBite Admin" },
      { name: "description", content: "Manage registered donors, NGOs, volunteers, and platform administrators." },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => listAdminUsers(),
  });

  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      const roles: string[] = (u.user_roles ?? []).map((r: any) => r.role);

      if (activeTab !== "all" && !roles.includes(activeTab)) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = u.full_name?.toLowerCase().includes(q) ?? false;
        const orgMatch = u.organization_name?.toLowerCase().includes(q) ?? false;
        const phoneMatch = u.phone?.toLowerCase().includes(q) ?? false;
        const addrMatch = u.address?.toLowerCase().includes(q) ?? false;
        return nameMatch || orgMatch || phoneMatch || addrMatch;
      }

      return true;
    });
  }, [users, activeTab, search]);

  const counts = useMemo(() => {
    let donors = 0;
    let ngos = 0;
    let volunteers = 0;
    let admins = 0;

    users.forEach((u: any) => {
      const roles: string[] = (u.user_roles ?? []).map((r: any) => r.role);
      if (roles.includes("donor")) donors++;
      if (roles.includes("ngo")) ngos++;
      if (roles.includes("volunteer")) volunteers++;
      if (roles.includes("admin")) admins++;
    });

    return { all: users.length, donor: donors, ngo: ngos, volunteer: volunteers, admin: admins };
  }, [users]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "donor":
        return <User className="size-3 mr-1 text-primary" />;
      case "ngo":
        return <Building2 className="size-3 mr-1 text-sky-600" />;
      case "volunteer":
        return <Truck className="size-3 mr-1 text-emerald-600" />;
      case "admin":
        return <ShieldCheck className="size-3 mr-1 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader
        title="User Management"
        description="Everyone registered on the platform across all four stakeholder roles."
        actions={
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {users.length} Registered Accounts
            </span>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 sm:w-[500px]">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="donor">Donors ({counts.donor})</TabsTrigger>
            <TabsTrigger value="ngo">NGOs ({counts.ngo})</TabsTrigger>
            <TabsTrigger value="volunteer">Volunteers ({counts.volunteer})</TabsTrigger>
            <TabsTrigger value="admin">Admins ({counts.admin})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, org, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="border-border/70 p-12 text-center shadow-[var(--shadow-card)]">
          <div className="size-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <Users className="size-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No users found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            No registered users match your search query or role filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u: any) => {
            const roles: string[] = (u.user_roles ?? []).map((r: any) => r.role);

            return (
              <Card
                key={u.id}
                className="border-border/70 shadow-[var(--shadow-card)] hover:border-primary/40 transition-all"
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{u.full_name}</span>
                      {u.organization_name && (
                        <span className="text-xs text-muted-foreground font-medium">
                          ({u.organization_name})
                        </span>
                      )}
                      <StatusBadge status={u.status || "active"} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {u.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" />
                          {u.phone}
                        </span>
                      )}
                      {u.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {u.address}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        Joined {new Date(u.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    {roles.map((role) => (
                      <Badge
                        key={role}
                        variant="outline"
                        className="capitalize text-xs flex items-center py-0.5"
                      >
                        {getRoleIcon(role)}
                        {role}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
