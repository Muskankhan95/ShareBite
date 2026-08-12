import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Clock,
  HeartHandshake,
  Leaf,
  MapPin,
  PackageCheck,
  Salad,
  ShieldCheck,
  Truck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicShell } from "@/components/layout/public-shell";
import { site } from "@/config/site";
import heroImage from "@/assets/hero-foodrescue.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FoodRescue — Save Food. Share Hope." },
      {
        name: "description",
        content:
          "FoodRescue connects surplus food from restaurants, canteens and events with verified NGOs and volunteers before it goes to waste.",
      },
      { property: "og:title", content: "FoodRescue — Save Food. Share Hope." },
      {
        property: "og:description",
        content:
          "A social-impact platform linking surplus food donors, verified NGOs and volunteers.",
      },
    ],
  }),
  component: LandingPage,
});

const impactStats = [
  { label: "Meals Rescued", value: "—", hint: "Live once donations go online" },
  { label: "Food Saved", value: "—", hint: "Measured in kilograms" },
  { label: "Active Donors", value: "—", hint: "Restaurants, canteens, hosts" },
  { label: "Successful Deliveries", value: "—", hint: "Volunteer completed runs" },
];

const problems = [
  {
    icon: UtensilsCrossed,
    title: "Good food is thrown away daily",
    body: "Restaurants, hostels and events end each day with edible surplus that has nowhere to go before it spoils.",
  },
  {
    icon: Clock,
    title: "Surplus food has a short window",
    body: "Prepared food stays safe only for a few hours, so coordination over calls and chats is usually too slow.",
  },
  {
    icon: MapPin,
    title: "Nobody knows who needs it nearby",
    body: "Community kitchens and NGOs cannot see what is available around them at the moment it becomes available.",
  },
];

const steps = [
  {
    icon: PackageCheck,
    title: "Donor lists surplus",
    body: "A donor posts what is available, how many servings and the pickup window.",
  },
  {
    icon: Building2,
    title: "Verified NGO requests it",
    body: "Nearby verified organizations see the listing and request the food they can distribute.",
  },
  {
    icon: Truck,
    title: "Volunteer picks up",
    body: "A volunteer accepts the pickup, collects the food and delivers it to the NGO.",
  },
  {
    icon: HeartHandshake,
    title: "Meals reach people",
    body: "The delivery is confirmed and the rescued food is counted towards community impact.",
  },
];

const audiences = [
  {
    icon: Salad,
    title: "Donors",
    body: "Restaurants, hotels, college canteens, hostels, event organizers and individuals with surplus food.",
    to: "/register",
    cta: "Register as donor",
  },
  {
    icon: ShieldCheck,
    title: "NGOs",
    body: "Verified organizations and community kitchens that request, receive and distribute donated food.",
    to: "/register",
    cta: "Register your NGO",
  },
  {
    icon: Truck,
    title: "Volunteers",
    body: "People who can collect food from donors and deliver it safely to the nearest organization.",
    to: "/register",
    cta: "Join as volunteer",
  },
  {
    icon: Users,
    title: "Admins",
    body: "Platform teams who verify NGOs, monitor donations and keep the network trustworthy.",
    to: "/admin",
    cta: "View admin area",
  },
];

function LandingPage() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="container-page grid gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div className="space-y-7">
            <Badge
              variant="outline"
              className="rounded-full border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-primary-foreground"
            >
              <Leaf className="mr-1.5 size-3.5" />
              Social impact, powered by community
            </Badge>
            <h1 className="text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              Save Food. <span className="text-accent">Share Hope.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
              {site.description}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" variant="accent">
                <Link to="/register">
                  Donate Food
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="onHero">
                <Link to="/register">Join as Volunteer</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="link"
                className="text-primary-foreground underline"
              >
                <Link to="/ngo/nearby">Find Food</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-primary-foreground/20 shadow-[var(--shadow-elevated)]">
              <img
                src={heroImage}
                alt="Volunteers packing surplus vegetables and bread into boxes at a community kitchen"
                width={1600}
                height={1104}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Impact stats */}
      <section aria-labelledby="impact-stats" className="border-b border-border bg-card">
        <div className="container-page py-10">
          <h2 id="impact-stats" className="sr-only">
            Impact statistics
          </h2>
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {impactStats.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <dd className="font-display text-3xl font-semibold text-primary">{stat.value}</dd>
                <dt className="text-sm font-semibold">{stat.label}</dt>
                <p className="text-xs text-muted-foreground">{stat.hint}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The problem */}
      <section className="container-page py-16 sm:py-20">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            The problem
          </p>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Food waste and hunger exist on the same street
          </h2>
          <p className="text-muted-foreground">
            The gap is rarely a lack of food. It is a lack of coordination between the people who
            have surplus and the organizations that can distribute it in time.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {problems.map(({ icon: Icon, title, body }) => (
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
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-soft py-16 sm:py-20">
        <div className="container-page">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              How FoodRescue works
            </p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Four steps, one rescued meal</h2>
          </div>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, body }, index) => (
              <li key={title}>
                <Card className="h-full border-border/70 bg-card shadow-[var(--shadow-card)]">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                        <Icon className="size-5" />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Step {index + 1}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription className="leading-relaxed">{body}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link to="/how-it-works">
                See the full process
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Who can use */}
      <section className="container-page py-16 sm:py-20">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Who can use FoodRescue
          </p>
          <h2 className="text-3xl font-semibold sm:text-4xl">Built for four kinds of people</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map(({ icon: Icon, title, body, to, cta }) => (
            <Card key={title} className="flex flex-col border-border/70 shadow-[var(--shadow-card)]">
              <CardHeader className="flex-1">
                <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </span>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="leading-relaxed">{body}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="soft" size="sm" className="w-full">
                  <Link to={to as "/"}>{cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Our impact */}
      <section className="border-y border-border bg-secondary/40 py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Our impact
            </p>
            <h2 className="text-3xl font-semibold sm:text-4xl">
              Every rescued tray is measurable
            </h2>
            <p className="text-muted-foreground">
              FoodRescue records each donation, pickup and delivery so donors, NGOs and volunteers
              can all see what their effort added up to. Impact numbers appear here as soon as
              donation tracking goes live.
            </p>
            <Button asChild variant="outline">
              <Link to="/about">
                About FoodRescue
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-lg">What we will track</CardTitle>
              <CardDescription>
                Transparent, per-donation reporting for every participant.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                "Meals rescued per city",
                "Kilograms of food saved",
                "Average pickup time",
                "Deliveries completed",
                "Active donor organizations",
                "Volunteer participation",
              ].map((item) => (
                <p key={item} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                  />
                  {item}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16 sm:py-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-hero px-6 py-14 text-center text-primary-foreground sm:px-12">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold sm:text-4xl">
            Surplus food today can be someone's meal tonight
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            Join FoodRescue as a donor, an organization or a volunteer and help move good food to
            the people who need it.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="accent">
              <Link to="/register">Create an account</Link>
            </Button>
            <Button asChild size="lg" variant="onHero">
              <Link to="/contact">Talk to the team</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
