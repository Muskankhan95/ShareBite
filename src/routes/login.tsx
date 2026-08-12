import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { roleLabels } from "@/config/navigation";
import type { UserRole } from "@/types";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in to FoodRescue" },
      {
        name: "description",
        content: "Sign in to your FoodRescue donor, NGO, volunteer or admin workspace.",
      },
      { property: "og:title", content: "Log in to FoodRescue" },
      { property: "og:description", content: "Access your FoodRescue workspace." },
    ],
  }),
  component: LoginPage,
});

const workspaces: { role: UserRole; to: string }[] = [
  { role: "donor", to: "/donor" },
  { role: "ngo", to: "/ngo" },
  { role: "volunteer", to: "/volunteer" },
  { role: "admin", to: "/admin" },
];

function LoginPage() {
  return (
    <PublicShell>
      <div className="container-page grid max-w-5xl gap-8 py-14 lg:grid-cols-2 lg:items-start">
        <Card className="border-border/70 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Log in to continue rescuing food.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" />
              </div>
              <Button type="submit" variant="hero" disabled>
                Log in (not available yet)
              </Button>
            </form>
            <p className="text-sm text-muted-foreground">
              New to FoodRescue?{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Alert>
            <Info className="size-4" />
            <AlertTitle>Authentication is not connected yet</AlertTitle>
            <AlertDescription>
              Accounts, sessions and role permissions arrive with the backend. Until then you can
              open each workspace directly to review its structure and layouts.
            </AlertDescription>
          </Alert>

          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-lg">Preview a workspace</CardTitle>
              <CardDescription>Role-based areas, unprotected during the UI stage.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {workspaces.map(({ role, to }) => (
                <Button key={role} asChild variant="outline" className="justify-start">
                  <Link to={to as "/"}>{roleLabels[role]} dashboard</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicShell>
  );
}
