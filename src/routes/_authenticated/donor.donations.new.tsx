import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { NotImplementedPanel } from "@/components/common/not-implemented-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/donor/donations/new")({
  component: CreateDonation,
});

function CreateDonation() {
  return (
    <>
      <PageHeader
        title="Create donation"
        description="Describe the surplus food, how much of it there is, and when it can be picked up."
      />

      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-lg">Donation details</CardTitle>
          <CardDescription>
            Submitting is disabled until donation storage is connected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Donation title</Label>
                <Input id="title" placeholder="Cooked rice and dal, 40 servings" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foodType">Food type</Label>
                <Select disabled>
                  <SelectTrigger id="foodType">
                    <SelectValue placeholder="Select food type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cooked">Cooked meals</SelectItem>
                    <SelectItem value="raw">Raw ingredients</SelectItem>
                    <SelectItem value="packaged">Packaged food</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="servings">Approximate servings</Label>
                <Input id="servings" type="number" min={1} placeholder="40" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupStart">Pickup window starts</Label>
                <Input id="pickupStart" type="datetime-local" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupEnd">Pickup window ends</Label>
                <Input id="pickupEnd" type="datetime-local" disabled />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Pickup address</Label>
                <Input id="address" placeholder="Street, area, city" disabled />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Handling notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Packaging, storage temperature, allergens…"
                  disabled
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-4 sm:col-span-2">
                <div className="space-y-1">
                  <Label htmlFor="veg">Vegetarian only</Label>
                  <p className="text-xs text-muted-foreground">
                    Helps organizations match the food to their community.
                  </p>
                </div>
                <Switch id="veg" disabled />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="hero" disabled>
                Publish donation (not available yet)
              </Button>
              <Button type="button" variant="outline" disabled>
                Save as draft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <NotImplementedPanel
        feature="Donation creation"
        planned={[
          "Validation with schema rules",
          "Address autocomplete and geocoding",
          "Photo upload for the food",
          "Automatic expiry of unclaimed listings",
        ]}
      />
    </>
  );
}
