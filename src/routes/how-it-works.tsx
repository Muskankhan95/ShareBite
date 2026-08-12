import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, PackageCheck, Truck, Users } from "lucide-react";
import { PublicPage, PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How FoodRescue Works — From surplus to served meal" },
      {
        name: "description",
        content:
          "See how donors list surplus food, verified NGOs request it and volunteers deliver it with FoodRescue.",
      },
      { property: "og:title", content: "How FoodRescue Works" },
      {
        property: "og:description",
        content: "The donor, NGO and volunteer journey step by step.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const journeys = [
  {
    icon: PackageCheck,
    role: "Donor",
    steps: [
      "Create a donation with food type, servings and pickup window",
      "Confirm the pickup address and packaging details",
      "Approve the organization that requested the food",
      "Track the pickup until delivery is confirmed",
    ],
  },
  {
    icon: Building2,
    role: "NGO",
    steps: [
      "Complete verification with the platform team",
      "Browse nearby available food in real time",
      "Request donations that match distribution capacity",
      "Confirm receipt once the volunteer delivers",
    ],
  },
  {
    icon: Truck,
    role: "Volunteer",
    steps: [
      "Browse open pickups near your location",
      "Accept a pickup and collect from the donor",
      "Deliver to the assigned organization",
      "Mark the delivery complete to close the loop",
    ],
  },
  {
    icon: Users,
    role: "Admin",
    steps: [
      "Review and verify NGO applications",
      "Monitor donations, pickups and disputes",
      "Manage users and platform-wide reports",
      "Publish community impact statistics",
    ],
  },
];

function HowItWorksPage() {
  return (
    <PublicShell>
      <PublicPage>
        <header className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            How it works
          </p>
          <h1 className="text-4xl font-semibold sm:text-5xl">One workflow, four perspectives</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            A donation moves through a single, traceable lifecycle. Each role sees only what it
            needs to act on, which keeps handovers fast and accountable.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-2">
          {journeys.map(({ icon: Icon, role, steps }) => (
            <Card key={role} className="border-border/70 shadow-[var(--shadow-card)]">
              <CardHeader>
                <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <CardTitle className="text-lg">{role} journey</CardTitle>
                <CardDescription>What this role does inside FoodRescue.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  {steps.map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl bg-gradient-hero px-8 py-12 text-center text-primary-foreground">
          <h2 className="text-2xl font-semibold sm:text-3xl">Ready to be part of the chain?</h2>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="accent">
              <Link to="/register">Create an account</Link>
            </Button>
            <Button asChild size="lg" variant="onHero">
              <Link to="/contact">Ask a question</Link>
            </Button>
          </div>
        </section>
      </PublicPage>
    </PublicShell>
  );
}
