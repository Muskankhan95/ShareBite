import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { PublicPage, PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { NotImplementedPanel } from "@/components/common/not-implemented-panel";
import { site } from "@/config/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact FoodRescue — Partnerships and support" },
      {
        name: "description",
        content:
          "Reach the FoodRescue team about donations, NGO verification, volunteering or partnerships.",
      },
      { property: "og:title", content: "Contact FoodRescue" },
      {
        property: "og:description",
        content: "Get in touch with the FoodRescue team.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PublicShell>
      <PublicPage>
        <header className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Contact</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Talk to the FoodRescue team</h1>
          <p className="text-lg text-muted-foreground">
            Questions about donating, NGO verification or volunteering? Send us a note and we will
            get back to you.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-lg">Send a message</CardTitle>
              <CardDescription>
                Message delivery is not connected yet — this form is presentation only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" placeholder="Asha Kumar" autoComplete="name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="I'd like to donate surplus food" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" rows={5} placeholder="Tell us a little about it…" />
                </div>
                <Button type="submit" variant="hero" disabled>
                  Sending is not available yet
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/70 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-lg">Reach us directly</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="flex items-start gap-3">
                  <Mail className="mt-0.5 size-4 text-primary" />
                  {site.email}
                </p>
                <p className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 text-primary" />
                  {site.phone}
                </p>
                <p className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 text-primary" />
                  {site.address}
                </p>
              </CardContent>
            </Card>

            <NotImplementedPanel
              feature="Support inbox"
              description="Contact submissions will be stored and routed to the platform team."
              planned={["Email delivery", "Ticket tracking", "Spam protection"]}
            />
          </div>
        </div>
      </PublicPage>
    </PublicShell>
  );
}
