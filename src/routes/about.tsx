import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, Recycle, Target, Users } from "lucide-react";
import { PublicPage, PublicShell } from "@/components/layout/public-shell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About FoodRescue — Our mission against food waste" },
      {
        name: "description",
        content:
          "FoodRescue is a community platform that moves surplus edible food from donors to verified NGOs through volunteers.",
      },
      { property: "og:title", content: "About FoodRescue" },
      {
        property: "og:description",
        content: "Why FoodRescue exists and how the network is organized.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: Target,
    title: "Speed over paperwork",
    body: "Surplus food is time-sensitive. Every screen is designed to shorten the path from listing to delivery.",
  },
  {
    icon: Users,
    title: "Verified organizations only",
    body: "Food is handed to organizations that have been checked by the platform team, keeping the chain trustworthy.",
  },
  {
    icon: Recycle,
    title: "Measured impact",
    body: "Donations, pickups and deliveries are recorded so impact is reported honestly, never estimated.",
  },
  {
    icon: Leaf,
    title: "Dignity first",
    body: "Rescued food is treated as a meal for a person, not as waste being disposed of.",
  },
];

function AboutPage() {
  return (
    <PublicShell>
      <PublicPage>
        <header className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            About FoodRescue
          </p>
          <h1 className="text-4xl font-semibold sm:text-5xl">
            A coordination layer for surplus food
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            FoodRescue exists because edible food and hunger often sit a few kilometres apart with
            no reliable way to connect them. The platform brings donors, verified NGOs and
            volunteers into one workflow so surplus food is collected and distributed while it is
            still safe to eat.
          </p>
        </header>

        <section className="grid gap-5 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-border/70 shadow-[var(--shadow-card)]">
              <CardHeader>
                <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </span>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="leading-relaxed">{body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl border border-border bg-secondary/40 p-8">
          <h2 className="text-2xl font-semibold">Where the project stands</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            This release covers the product architecture: navigation, role-based workspaces,
            reusable UI components and responsive layouts. Donation, request and delivery
            functionality is scheduled next, and screens that depend on it clearly say so instead of
            simulating results.
          </p>
          <Button asChild className="mt-6" variant="hero">
            <Link to="/how-it-works">See how it works</Link>
          </Button>
        </section>
      </PublicPage>
    </PublicShell>
  );
}
