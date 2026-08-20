import { Link } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { roleHome, useAuth } from "@/lib/auth/auth-context";
import { roleLabels } from "@/config/navigation";
import type { UserRole } from "@/types";

/**
 * Authorization boundary for a role workspace. The route gate already proved the
 * visitor is signed in; this decides whether their role may see this workspace.
 * Data access is independently enforced by row-level security on the backend.
 */
export function RoleGate({ role }: { role: UserRole }) {
  const { account, accountLoading } = useAuth();

  if (accountLoading || !account) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" aria-label="Loading workspace" />
      </div>
    );
  }

  if (account.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-md border-border/70 shadow-[var(--shadow-card)]">
          <CardHeader className="space-y-3">
            <ShieldAlert className="size-6 text-destructive" />
            <CardTitle>You don't have access to this workspace</CardTitle>
            <CardDescription>
              Your account is registered as {roleLabels[account.role]}. The {roleLabels[role]}{" "}
              workspace is limited to {roleLabels[role]} accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="hero" className="w-full">
              <Link to={roleHome[account.role] as "/"}>Go to my dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <DashboardShell role={role} />;
}
