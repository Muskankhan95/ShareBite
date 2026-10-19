import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { loadAccount } from "@/lib/auth/account.functions";
import { roleHome } from "@/lib/auth/auth-context";
import { loginSchema } from "@/lib/auth/schemas";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Log in to ShareBite" },
      {
        name: "description",
        content: "Sign in to your ShareBite donor, NGO, volunteer or admin workspace.",
      },
      { property: "og:title", content: "Log in to ShareBite" },
      { property: "og:description", content: "Access your ShareBite workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [values, setValues] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      setLoading(false);
      setFormError(
        error.message.toLowerCase().includes("invalid")
          ? "Invalid email or password. Please try again."
          : error.message,
      );
      return;
    }

    try {
      const account = await loadAccount();
      const target =
        search.redirect && search.redirect.startsWith("/") && !search.redirect.startsWith("//")
          ? search.redirect
          : roleHome[account.role];
      await navigate({ to: target as "/", replace: true });
    } catch {
      setFormError("We signed you in but couldn't load your workspace. Please refresh and retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <div className="container-page grid max-w-5xl gap-8 py-14 lg:grid-cols-2 lg:items-start">
        <Card className="border-border/70 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Log in to continue rescuing food.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
              {formError ? (
                <Alert variant="destructive" role="alert">
                  <AlertTitle>Sign-in failed</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                  aria-invalid={Boolean(fieldErrors["email"])}
                />
                {fieldErrors["email"] ? (
                  <p className="text-xs text-destructive">{fieldErrors["email"]}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
                  aria-invalid={Boolean(fieldErrors["password"])}
                />
                {fieldErrors["password"] ? (
                  <p className="text-xs text-destructive">{fieldErrors["password"]}</p>
                ) : null}
              </div>

              <Button type="submit" variant="hero" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                {loading ? "Signing in…" : "Log in"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground">
              New to ShareBite?{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-lg">Role-based workspaces</CardTitle>
            <CardDescription>
              After signing in you land in the workspace that matches your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Donors manage surplus food listings and donation history.</p>
            <p>NGOs browse nearby food, request donations and track deliveries.</p>
            <p>Volunteers accept pickups and deliver rescued food.</p>
            <p>Admins verify NGOs and oversee the platform.</p>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
