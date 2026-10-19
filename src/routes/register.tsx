import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { loadAccount } from "@/lib/auth/account.functions";
import { roleHome } from "@/lib/auth/auth-context";
import { registerSchema, type RegisterValues, type SignupRole } from "@/lib/auth/schemas";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Join ShareBite — Donor, NGO or volunteer registration" },
      {
        name: "description",
        content: "Register on ShareBite as a food donor, a verified NGO or a delivery volunteer.",
      },
      { property: "og:title", content: "Join ShareBite" },
      {
        property: "og:description",
        content: "Create a donor, NGO or volunteer account on ShareBite.",
      },
    ],
  }),
  component: RegisterPage,
});

const roles: { value: SignupRole; label: string; hint: string }[] = [
  {
    value: "donor",
    label: "Donor",
    hint: "Restaurant, hotel, canteen, hostel, event or individual",
  },
  { value: "ngo", label: "NGO", hint: "Organization that receives and distributes food" },
  { value: "volunteer", label: "Volunteer", hint: "Pick up food and deliver it to an NGO" },
];

const initialValues: RegisterValues = {
  role: "donor",
  fullName: "",
  organizationName: "",
  organizationAddress: "",
  organizationContactPerson: "",
  address: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

function RegisterPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<RegisterValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateValue(field: keyof RegisterValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    const parsed = registerSchema.safeParse(values);
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
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          role: parsed.data.role,
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
          address: parsed.data.address,
          organization_name: parsed.data.organizationName,
          organization_address: parsed.data.organizationAddress,
          organization_contact_person: parsed.data.organizationContactPerson,
        },
      },
    });

    if (error) {
      setFormError(
        error.message.toLowerCase().includes("already registered")
          ? "An account with this email already exists. Try logging in instead."
          : error.message,
      );
      setLoading(false);
      return;
    }

    if (!data.session) {
      setSuccessMessage("Account created. Check your email to confirm your account, then log in.");
      setLoading(false);
      return;
    }

    try {
      const account = await loadAccount();
      await navigate({ to: roleHome[account.role] as "/", replace: true });
    } catch {
      setFormError(
        "Your account was created, but your workspace could not be loaded. Please log in.",
      );
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <div className="container-page grid max-w-5xl gap-8 py-14 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <Card className="border-border/70 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-2xl">Create your ShareBite account</CardTitle>
            <CardDescription>Choose how you want to take part in ShareBite.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
              {formError ? (
                <Alert variant="destructive" role="alert">
                  <AlertTitle>Registration failed</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}
              {successMessage ? (
                <Alert role="status">
                  <AlertTitle>Registration successful</AlertTitle>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              ) : null}

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">I am registering as</legend>
                <RadioGroup
                  value={values.role}
                  onValueChange={(value) => updateValue("role", value)}
                  className="grid gap-3"
                >
                  {roles.map((role) => (
                    <Label
                      key={role.value}
                      htmlFor={role.value}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/60 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-soft/60"
                    >
                      <RadioGroupItem id={role.value} value={role.value} className="mt-0.5" />
                      <span className="space-y-1">
                        <span className="block text-sm font-semibold">{role.label}</span>
                        <span className="block text-xs text-muted-foreground">{role.hint}</span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="fullName" label="Full name" error={fieldErrors.fullName}>
                  <Input
                    id="fullName"
                    autoComplete="name"
                    placeholder="Asha Kumar"
                    value={values.fullName}
                    onChange={(e) => updateValue("fullName", e.target.value)}
                  />
                </Field>
                <Field id="email" label="Email" error={fieldErrors.email}>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={values.email}
                    onChange={(e) => updateValue("email", e.target.value)}
                  />
                </Field>
                <Field id="phone" label="Phone" error={fieldErrors.phone}>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+91 90000 00000"
                    value={values.phone}
                    onChange={(e) => updateValue("phone", e.target.value)}
                  />
                </Field>
                <Field
                  id="address"
                  label={values.role === "volunteer" ? "Address / location" : "Address (optional)"}
                  error={fieldErrors.address}
                >
                  <Input
                    id="address"
                    autoComplete="street-address"
                    placeholder="Bengaluru"
                    value={values.address}
                    onChange={(e) => updateValue("address", e.target.value)}
                  />
                </Field>
                {values.role !== "volunteer" ? (
                  <Field
                    id="organizationName"
                    label="Organization (optional)"
                    error={fieldErrors.organizationName}
                  >
                    <Input
                      id="organizationName"
                      placeholder="Green Leaf Restaurant"
                      value={values.organizationName}
                      onChange={(e) => updateValue("organizationName", e.target.value)}
                    />
                  </Field>
                ) : null}
                {values.role === "ngo" ? (
                  <>
                    <Field
                      id="organizationAddress"
                      label="Organization address"
                      error={fieldErrors.organizationAddress}
                    >
                      <Input
                        id="organizationAddress"
                        placeholder="12 Park Road, Bengaluru"
                        value={values.organizationAddress}
                        onChange={(e) => updateValue("organizationAddress", e.target.value)}
                      />
                    </Field>
                    <Field
                      id="organizationContactPerson"
                      label="Contact person"
                      error={fieldErrors.organizationContactPerson}
                    >
                      <Input
                        id="organizationContactPerson"
                        placeholder="Asha Kumar"
                        value={values.organizationContactPerson}
                        onChange={(e) => updateValue("organizationContactPerson", e.target.value)}
                      />
                    </Field>
                  </>
                ) : null}
                <Field id="password" label="Password" error={fieldErrors.password}>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={values.password}
                    onChange={(e) => updateValue("password", e.target.value)}
                  />
                </Field>
                <Field
                  id="confirmPassword"
                  label="Confirm password"
                  error={fieldErrors.confirmPassword}
                >
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={values.confirmPassword}
                    onChange={(e) => updateValue("confirmPassword", e.target.value)}
                  />
                </Field>
              </div>

              <Button type="submit" variant="hero" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-lg">Already registered?</CardTitle>
            <CardDescription>Head to the login screen.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
