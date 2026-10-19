import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Sparkles, AlertCircle, Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
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
import { useAuth } from "@/lib/auth/auth-context";
import { createDonation } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/donor/donations/new")({
  head: () => ({
    meta: [
      { title: "List Surplus Food — ShareBite" },
      { name: "description", content: "Post surplus food for pickup by verified local NGOs." },
    ],
  }),
  component: CreateDonation,
});

type Category = "cooked" | "raw" | "packaged" | "bakery" | "dairy" | "produce" | "other";
type StorageMethod = "ambient" | "refrigerated" | "frozen" | "hot_hold";
type QuantityUnit = "kg" | "portions" | "packets" | "trays" | "litres";

function getIsoDateTime(offsetHours = 4): string {
  const date = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function getNowIsoDateTime(): string {
  const date = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function CreateDonation() {
  const { account } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("cooked");
  const [quantity, setQuantity] = useState<string>("10");
  const [quantityUnit, setQuantityUnit] = useState<QuantityUnit>("kg");
  const [servings, setServings] = useState<string>("30");
  const [storageMethod, setStorageMethod] = useState<StorageMethod>("ambient");
  const [preparationTime, setPreparationTime] = useState<string>(getNowIsoDateTime());
  const [availableUntil, setAvailableUntil] = useState<string>(getIsoDateTime(5));
  const [allergens, setAllergens] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");

  useEffect(() => {
    if (account) {
      const defaultAddress =
        account.organizationAddress ||
        account.address ||
        (account.donorProfile?.address ?? "");
      if (defaultAddress && !pickupAddress) {
        setPickupAddress(defaultAddress);
      }
    }
  }, [account, pickupAddress]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!foodName.trim()) {
      toast.error("Please enter a donation title");
      return;
    }
    if (!pickupAddress.trim()) {
      toast.error("Please provide a pickup address");
      return;
    }
    const numQuantity = Number(quantity);
    const numServings = Number(servings);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast.error("Please provide a valid quantity");
      return;
    }
    if (isNaN(numServings) || numServings <= 0) {
      toast.error("Please provide valid approximate servings");
      return;
    }

    setLoading(true);
    try {
      await createDonation({
        data: {
          foodName: foodName.trim(),
          description: description.trim() || undefined,
          category,
          quantity: numQuantity,
          quantityUnit,
          servings: Math.round(numServings),
          preparationTime: preparationTime ? new Date(preparationTime).toISOString() : undefined,
          availableUntil: new Date(availableUntil).toISOString(),
          storageMethod,
          allergens: allergens.trim() || undefined,
          pickupAddress: pickupAddress.trim(),
        },
      });

      toast.success("Food donation listed successfully! Local NGOs will be notified.");
      await navigate({ to: "/donor/donations" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to publish donation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Create Food Donation"
        description="Share your surplus edible food with verified NGOs and volunteer couriers."
      />

      <Card className="border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Sparkles className="size-4" />
            <span>AI-Assisted Listing & Smart Redistribution</span>
          </div>
          <CardTitle className="text-xl">Surplus Food Specifications</CardTitle>
          <CardDescription>
            Accurate details help NGOs determine suitability and arrange timely transport.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="foodName">Food item title *</Label>
                <Input
                  id="foodName"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. Freshly Cooked Rice, Dal & Veg Pulav"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={(val: Category) => setCategory(val)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cooked">Cooked meals</SelectItem>
                    <SelectItem value="raw">Raw ingredients</SelectItem>
                    <SelectItem value="packaged">Packaged food</SelectItem>
                    <SelectItem value="bakery">Bakery & Breads</SelectItem>
                    <SelectItem value="dairy">Dairy products</SelectItem>
                    <SelectItem value="produce">Fresh produce / Fruits / Veg</SelectItem>
                    <SelectItem value="other">Other edible items</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storageMethod">Storage method *</Label>
                <Select
                  value={storageMethod}
                  onValueChange={(val: StorageMethod) => setStorageMethod(val)}
                >
                  <SelectTrigger id="storageMethod">
                    <SelectValue placeholder="Storage method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambient">Ambient / Room Temperature</SelectItem>
                    <SelectItem value="refrigerated">Refrigerated (0 - 4°C)</SelectItem>
                    <SelectItem value="frozen">Frozen (&lt; -18°C)</SelectItem>
                    <SelectItem value="hot_hold">Hot-Held (&gt; 60°C)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <div className="grid grid-cols-[1fr_120px] gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                  <Select
                    value={quantityUnit}
                    onValueChange={(val: QuantityUnit) => setQuantityUnit(val)}
                  >
                    <SelectTrigger aria-label="Quantity unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="portions">portions</SelectItem>
                      <SelectItem value="packets">packets</SelectItem>
                      <SelectItem value="trays">trays</SelectItem>
                      <SelectItem value="litres">litres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="servings">Approximate meals / servings *</Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="e.g. 40"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preparationTime" className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  Prepared at (approx)
                </Label>
                <Input
                  id="preparationTime"
                  type="datetime-local"
                  value={preparationTime}
                  onChange={(e) => setPreparationTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableUntil" className="flex items-center gap-1.5 font-semibold text-primary">
                  <Calendar className="size-3.5" />
                  Must be consumed / picked up before *
                </Label>
                <Input
                  id="availableUntil"
                  type="datetime-local"
                  value={availableUntil}
                  onChange={(e) => setAvailableUntil(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pickupAddress" className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  Pickup location & Address *
                </Label>
                <Input
                  id="pickupAddress"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Full pickup address, landmarks, kitchen back gate"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="allergens" className="flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 text-amber-500" />
                  Allergen or dietary information (optional)
                </Label>
                <Input
                  id="allergens"
                  value={allergens}
                  onChange={(e) => setAllergens(e.target.value)}
                  placeholder="e.g. 100% Pure Vegetarian, Contains nuts/gluten, Halal certified"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Handling instructions & notes</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Packaging details, whether donor provides bags/containers, contact person at venue..."
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" variant="hero" disabled={loading} className="gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                {loading ? "Publishing listing…" : "Publish donation listing"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/donor/donations" })}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
