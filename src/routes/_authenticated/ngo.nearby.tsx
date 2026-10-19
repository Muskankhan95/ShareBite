import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Clock,
  Package,
  Utensils,
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Thermometer,
  ShieldAlert,
  Send,
  Building2,
  X,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listNearbyDonations, listMyRequests, requestDonation } from "@/lib/data.functions";
import { calculateFoodUrgency } from "@/lib/ai-matcher";

export const Route = createFileRoute("/_authenticated/ngo/nearby")({
  head: () => ({
    meta: [
      { title: "Find Nearby Surplus Food — ShareBite" },
      { name: "description", content: "Discover and request edible surplus food from local donors." },
    ],
  }),
  component: NearbyFood,
});

function NearbyFood() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [storageFilter, setStorageFilter] = useState("all");

  // Selected donation for request modal
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [requestedQuantity, setRequestedQuantity] = useState<number>(1);
  const [requestNote, setRequestNote] = useState("");

  const { data: donations = [], isLoading: isLoadingDonations } = useQuery({
    queryKey: ["nearbyDonations"],
    queryFn: () => listNearbyDonations(),
    refetchInterval: 30000,
  });

  const { data: myRequests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ["myNgoRequests"],
    queryFn: () => listMyRequests(),
  });

  // Track which donation IDs have active requests by this NGO
  const requestedDonationIds = useMemo(() => {
    return new Set(
      myRequests
        .filter((r) => ["pending", "approved"].includes(r.status))
        .map((r) => r.donation_id)
    );
  }, [myRequests]);

  const requestMutation = useMutation({
    mutationFn: (vars: { donationId: string; requestedQuantity: number; note?: string }) =>
      requestDonation({ data: vars }),
    onSuccess: () => {
      toast.success("Food request sent to donor! They will be notified.");
      setSelectedDonation(null);
      setRequestNote("");
      queryClient.invalidateQueries({ queryKey: ["myNgoRequests"] });
      queryClient.invalidateQueries({ queryKey: ["nearbyDonations"] });
      queryClient.invalidateQueries({ queryKey: ["ngoDashboardStats"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to send food request");
    },
  });

  const handleOpenRequestModal = (donation: any) => {
    setSelectedDonation(donation);
    setRequestedQuantity(donation.quantity);
    setRequestNote("");
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonation) return;
    if (requestedQuantity <= 0 || requestedQuantity > selectedDonation.quantity) {
      toast.error(`Please enter a quantity between 1 and ${selectedDonation.quantity}`);
      return;
    }
    requestMutation.mutate({
      donationId: selectedDonation.id,
      requestedQuantity,
      note: requestNote.trim() || undefined,
    });
  };

  // Helper to calculate hours left until expiry
  const getHoursRemaining = (isoDate: string) => {
    const diffMs = new Date(isoDate).getTime() - Date.now();
    return Math.max(0, diffMs / (1000 * 60 * 60));
  };

  const filteredDonations = useMemo(() => {
    return donations.filter((item) => {
      // Search text match
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = item.food_name.toLowerCase().includes(q);
        const matchesAddress = item.pickup_address.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesAddress && !matchesDesc) return false;
      }

      // Category match
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;

      // Storage method match
      if (storageFilter !== "all" && item.storage_method !== storageFilter) return false;

      // Urgency filter
      const hours = getHoursRemaining(item.available_until);
      if (urgencyFilter === "urgent" && hours > 4) return false;
      if (urgencyFilter === "today" && hours > 12) return false;

      return true;
    });
  }, [donations, search, categoryFilter, storageFilter, urgencyFilter]);

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryFilter !== "all" ||
    urgencyFilter !== "all" ||
    storageFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setUrgencyFilter("all");
    setStorageFilter("all");
  };

  return (
    <>
      <PageHeader
        title="Nearby Surplus Food"
        description="Fresh, edible surplus food from certified food donors ready for pickup and distribution."
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Discovery
            </span>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="border-border/70 shadow-[var(--shadow-card)] mb-6">
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by food name, location, or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="cooked">Cooked Meals</SelectItem>
                <SelectItem value="raw">Raw Produce</SelectItem>
                <SelectItem value="bakery">Bakery & Breads</SelectItem>
                <SelectItem value="packaged">Packaged Goods</SelectItem>
                <SelectItem value="dairy">Dairy & Refrigerated</SelectItem>
                <SelectItem value="produce">Fresh Produce</SelectItem>
                <SelectItem value="other">Other Food</SelectItem>
              </SelectContent>
            </Select>

            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Windows</SelectItem>
                <SelectItem value="urgent">Critical (&lt; 4h left)</SelectItem>
                <SelectItem value="today">Expiring Today (&lt; 12h)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={storageFilter} onValueChange={setStorageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Storage method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Storage</SelectItem>
                <SelectItem value="ambient">Ambient / Room Temp</SelectItem>
                <SelectItem value="refrigerated">Refrigerated</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
                <SelectItem value="hot_hold">Hot-Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
              <span>
                Found {filteredDonations.length} {filteredDonations.length === 1 ? "listing" : "listings"} matching your filters
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs text-primary hover:text-primary/80"
              >
                <X className="size-3 mr-1" />
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Listing Grid */}
      {isLoadingDonations ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredDonations.length === 0 ? (
        <Card className="border-border/70 p-12 text-center shadow-[var(--shadow-card)]">
          <div className="size-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <Utensils className="size-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {hasActiveFilters ? "No matching food found" : "No surplus food available right now"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {hasActiveFilters
              ? "Try adjusting your filters or keyword query to see more available donations."
              : "When local donors publish surplus food batches, they will immediately appear here for your organization to claim."}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Reset filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredDonations.map((donation) => {
            const hoursRemaining = getHoursRemaining(donation.available_until);
            const isCritical = hoursRemaining <= 4;
            const isModerate = hoursRemaining > 4 && hoursRemaining <= 12;
            const isAlreadyRequested = requestedDonationIds.has(donation.id);

            return (
              <Card
                key={donation.id}
                className={`flex flex-col justify-between border-border/70 shadow-[var(--shadow-card)] hover:border-primary/50 transition-all ${
                  isCritical ? "ring-1 ring-amber-500/30" : ""
                }`}
              >
                <div>
                  <CardHeader className="pb-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="capitalize text-xs font-medium">
                        {donation.category}
                      </Badge>

                      {/* AI Urgency Pill */}
                      {(() => {
                        const urgency = calculateFoodUrgency(donation.available_until, donation.storage_method);
                        if (urgency.level === "critical") {
                          return (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="size-3" />
                              ⚡ Critical ({urgency.score}% Urgency)
                            </span>
                          );
                        }
                        if (urgency.level === "high") {
                          return (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                              <Clock className="size-3" />
                              ⏳ High ({urgency.score}% Urgency)
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            🟢 Normal ({urgency.score}% Urgency)
                          </span>
                        );
                      })()}
                    </div>

                    <CardTitle className="text-lg line-clamp-1 font-bold">
                      {donation.food_name}
                    </CardTitle>
                    {donation.description && (
                      <CardDescription className="line-clamp-2 text-xs">
                        {donation.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 pb-3 text-xs">
                    {/* Portion Metrics */}
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                      <div className="flex items-center gap-2">
                        <Utensils className="size-4 text-primary shrink-0" />
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">Servings</span>
                          <p className="font-bold text-foreground text-sm">{donation.servings} meals</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Package className="size-4 text-primary shrink-0" />
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">Total Quantity</span>
                          <p className="font-bold text-foreground text-sm">
                            {donation.quantity} {donation.quantity_unit}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Storage & Expiry */}
                    <div className="space-y-1.5 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Thermometer className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="capitalize">Storage: <strong className="text-foreground font-medium">{donation.storage_method}</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-amber-600 shrink-0" />
                        <span>
                          Available until:{" "}
                          <strong className="text-foreground font-medium">
                            {new Date(donation.available_until).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" ("}
                            {new Date(donation.available_until).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                            {")"}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">
                          {donation.pickup_address}
                        </span>
                      </div>
                    </div>

                    {donation.allergens && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 p-2 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                        <ShieldAlert className="size-3.5 shrink-0 mt-0.5 text-amber-600" />
                        <span className="line-clamp-1">Allergens: {donation.allergens}</span>
                      </div>
                    )}
                  </CardContent>
                </div>

                <CardFooter className="pt-2 border-t border-border/50">
                  {isAlreadyRequested ? (
                    <Button
                      variant="outline"
                      className="w-full text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
                      disabled
                    >
                      <CheckCircle2 className="size-4 mr-2" />
                      Request Submitted
                    </Button>
                  ) : (
                    <Button
                      variant="hero"
                      className="w-full cursor-pointer"
                      onClick={() => handleOpenRequestModal(donation)}
                    >
                      <Send className="size-4 mr-2" />
                      Request This Food
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Request Food Modal */}
      <Dialog open={!!selectedDonation} onOpenChange={(open) => !open && setSelectedDonation(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedDonation && (
            <form onSubmit={handleSendRequest} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Send className="size-5 text-primary" />
                  Request Surplus Food
                </DialogTitle>
                <DialogDescription>
                  Send a distribution request to the donor for "{selectedDonation.food_name}".
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl bg-muted/40 p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Quantity:</span>
                  <span className="font-semibold">{selectedDonation.quantity} {selectedDonation.quantity_unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Total Portions:</span>
                  <span className="font-semibold">{selectedDonation.servings} meals</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pickup Location:</span>
                  <span className="font-semibold text-right line-clamp-1 max-w-[200px]">{selectedDonation.pickup_address}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Requested Quantity ({selectedDonation.quantity_unit})
                </label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  max={selectedDonation.quantity}
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(parseFloat(e.target.value) || 0)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  You can request all or a portion of this surplus donation.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Message / Pickup Notes for Donor
                </label>
                <Textarea
                  placeholder="e.g. We can pick up within 45 mins. Our shelter serves 50 hot meals tonight."
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDonation(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={requestMutation.isPending}
                >
                  {requestMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <Send className="size-4 mr-2" />
                  )}
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
