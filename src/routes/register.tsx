import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Join FoodRescue — Donor, NGO or volunteer registration" },
      {
        name: "description",
        content:
          "Register on FoodRescue as a food donor, a verified NGO or a delivery volunteer.",
      },
      { property: "og:title", content: "Join FoodRescue" },
      {
        property: "og:description",
        content: "Create a donor, NGO or volunteer account on FoodRescue.",
      },
    ],
  }),
  component: RegisterPage,
});

const roles = [
  { value: "donor", label: "Donor", hint: "Restaurant, hotel, canteen, hostel, event or individual" },
  { value: "ngo", label: "NGO", hint: "Organization that receives and distributes food" },
  { value: "volunteer", label: "Volunteer", hint: "Pick up food and deliver it to an NGO" },
];

function RegisterPage() {
  return (
    <PublicShell>
      <div className="container-page grid max-w-5xl gap-8 py-14 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <Card className="border-border/70 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Choose how you want to take part in FoodRescue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-6" onSubmit={(e) => e.preventDefault()}>
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">I am registering as</legend>
                <RadioGroup defaultValue="donor" className="grid gap-3">
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
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" autoComplete="name" placeholder="Asha Kumar" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization (optional)</Label>
                  <Input id="organization" placeholder="Green Leaf Restaurant" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" autoComplete="tel" placeholder="+91 90000 00000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Bengaluru" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" />
                </div>
              </div>

              <Button type="submit" variant="hero" disabled>
                Registration is not available yet
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Alert>
            <Info className="size-4" />
            <AlertTitle>Sign-up opens with the backend</AlertTitle>
            <AlertDescription>
              Account creation, NGO verification and role permissions are the next stage. This form
              shows the fields each role will provide.
            </AlertDescription>
          </Alert>
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
      </div>
    </PublicShell>
  );
}
