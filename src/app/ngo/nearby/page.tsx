"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCards } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { ngoService } from "@/lib/services/ngo.service";
import { DonationItem, FoodCategory } from "@/types/donation";
import { NGOVerificationStatus } from "@/types/ngo";
import { useAuth } from "@/lib/auth/auth-context";
import { formatTimeRemaining } from "@/lib/utils";
import ShareBiteMap from "@/components/map/ShareBiteMap";
import {
  MapPin,
  Filter,
  Search,
  Navigation2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Utensils,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Phone,
  Layers,
  Map as MapIcon,
  LayoutGrid,
} from "lucide-react";

export default function NearbyFoodPage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<NGOVerificationStatus>("verified");
  const [ngoCoords, setNgoCoords] = useState<[number, number]>([37.7858, -122.4042]);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(10);
  const [maxDistance, setMaxDistance] = useState("all");
  const [quantityFilter, setQuantityFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Claim Modal State
  const [selectedDonation, setSelectedDonation] = useState<DonationItem | null>(null);
  const [requestedPortions, setRequestedPortions] = useState<number>(0);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimedSuccess, setClaimedSuccess] = useState<DonationItem | null>(null);

  const loadData = async (radius: number = selectedRadiusKm) => {
    setLoading(true);
    try {
      const ngoUserId = user?.id || "usr_ngo_1";
      const [profile, items] = await Promise.all([
        ngoService.getNgoProfile(ngoUserId),
        ngoService.getNearbyAvailableDonations({
          radiusKm: radius,
          ngoUserId,
        }),
      ]);
      if (profile) {
        setVerificationStatus(profile.verificationStatus);
        if (profile.latitude && profile.longitude) {
          setNgoCoords([profile.latitude, profile.longitude]);
        }
      }
      setDonations(items);
    } catch (err) {
      console.error("Failed to load nearby food:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedRadiusKm);
  }, [user, selectedRadiusKm]);

  const isVerified = verificationStatus === "verified";

  // Filter application
  const filteredDonations = donations.filter((item) => {
    // 1. Food Category Filter
    if (selectedCategory !== "all" && item.foodType.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }

    // 2. Distance Filter
    if (maxDistance !== "all") {
      const maxD = Number(maxDistance);
      if (item.distanceMiles > maxD) return false;
    }

    // 3. Quantity Filter
    if (quantityFilter !== "all") {
      if (quantityFilter === "small" && item.servingsEstimate >= 25) return false;
      if (quantityFilter === "medium" && (item.servingsEstimate < 25 || item.servingsEstimate > 50)) return false;
      if (quantityFilter === "large" && item.servingsEstimate < 50) return false;
    }

    // 4. Time Remaining Filter
    if (timeFilter !== "all") {
      const diffHours = (new Date(item.expiresAt).getTime() - Date.now()) / (1000 * 3600);
      if (timeFilter === "urgent" && diffHours > 2) return false;
      if (timeFilter === "6h" && diffHours > 6) return false;
      if (timeFilter === "24h" && diffHours > 24) return false;
    }

    // 5. Search Text Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.foodType.toLowerCase().includes(q) ||
        item.donorName.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const openClaimModal = (item: DonationItem) => {
    setSelectedDonation(item);
    setRequestedPortions(item.servingsEstimate);
    setClaimError(null);
  };

  const handleConfirmClaim = async () => {
    if (!selectedDonation) return;

    if (!isVerified) {
      setClaimError(`Only verified NGOs can accept food donations. Current status: "${verificationStatus}".`);
      return;
    }

    if (requestedPortions <= 0) {
      setClaimError("Requested portions must be greater than zero.");
      return;
    }

    if (requestedPortions > selectedDonation.servingsEstimate) {
      setClaimError(`Requested quantity (${requestedPortions}) exceeds available servings (${selectedDonation.servingsEstimate}).`);
      return;
    }

    setClaimLoading(true);
    setClaimError(null);
    try {
      const ngoUserId = user?.id || "usr_ngo_1";
      const res = await ngoService.acceptDonation({
        donationId: selectedDonation.id,
        ngoUserId,
        requestedQuantity: requestedPortions,
      });

      setClaimedSuccess(selectedDonation);
      setSelectedDonation(null);
      loadData();
    } catch (err: any) {
      setClaimError(err.message || "Failed to claim donation.");
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <DashboardLayout
      role="ngo"
      title="Nearby Surplus Food"
      description="Live radar of surplus prepared meals, produce, and bakery available for immediate non-profit reservation."
    >
      <div className="space-y-6">
        {/* Verification Alert Banner if Not Verified */}
        {!isVerified && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">
                NGO Verification Status: <span className="uppercase text-amber-800">{verificationStatus}</span>
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Only verified non-profit partners can reserve and receive food surplus. Please verify your organization details in your{" "}
                <Link href="/ngo/profile" className="underline font-semibold">
                  Profile Settings
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        {/* Radar Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
              <Navigation2 className="w-3.5 h-3.5 animate-pulse" />
              Radius Radar Active
            </span>
            <h3 className="text-base font-bold text-white">
              Showing edible surplus within your active distribution radius
            </h3>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Accepting a donation reserves the entire surplus batch. A verified volunteer courier is dispatched immediately to transport the food directly to your address.
            </p>
          </div>
          <Link href="/ngo/requests">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 font-bold shrink-0 shadow-xs">
              Post Advance Requirement
            </Button>
          </Link>
        </div>

        {/* All Required Filters & Search Controls */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Food Category
                </label>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  options={[
                    { value: "all", label: "All Categories" },
                    { value: "Cooked meals", label: "Cooked meals" },
                    { value: "Rice", label: "Rice & Grains" },
                    { value: "Bread/roti", label: "Bread / Roti" },
                    { value: "Fruits", label: "Fresh Fruits" },
                    { value: "Vegetables", label: "Fresh Vegetables" },
                    { value: "Bakery", label: "Bakery & Pastries" },
                    { value: "Packaged food", label: "Packaged Groceries" },
                    { value: "Other", label: "Other" },
                  ]}
                />
              </div>

              {/* Distance Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Distance
                </label>
                <Select
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  options={[
                    { value: "all", label: "Any Distance" },
                    { value: "2", label: "Within 2 Miles" },
                    { value: "5", label: "Within 5 Miles" },
                    { value: "10", label: "Within 10 Miles" },
                    { value: "25", label: "Within 25 Miles" },
                  ]}
                />
              </div>

              {/* Quantity Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Quantity / Portions
                </label>
                <Select
                  value={quantityFilter}
                  onChange={(e) => setQuantityFilter(e.target.value)}
                  options={[
                    { value: "all", label: "Any Quantity" },
                    { value: "small", label: "Under 25 Servings" },
                    { value: "medium", label: "25 – 50 Servings" },
                    { value: "large", label: "50+ Servings" },
                  ]}
                />
              </div>

              {/* Time Remaining Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Time Remaining
                </label>
                <Select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  options={[
                    { value: "all", label: "Any Safe Window" },
                    { value: "urgent", label: "Under 2 Hours (Urgent)" },
                    { value: "6h", label: "Under 6 Hours" },
                    { value: "24h", label: "Under 24 Hours" },
                  ]}
                />
              </div>
            </div>

            {/* Keyword Search */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="w-full sm:w-96">
                <Input
                  placeholder="Search by food name, donor restaurant, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
              <span className="text-xs text-slate-500 hidden sm:block">
                Showing {filteredDonations.length} available surplus batches
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Radius Selector & View Mode Switch */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase mr-1">Discovery Radius:</span>
            {[1, 5, 10, 25, 50].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRadiusKm(r)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedRadiusKm === r
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grid View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "map"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Map Radar View
            </button>
          </div>
        </div>

        {/* View Switch: Map View vs Grid View */}
        {viewMode === "map" ? (
          <div className="space-y-4">
            <ShareBiteMap
              initialCenter={ngoCoords}
              selectedRadiusKm={selectedRadiusKm}
              onRadiusChange={setSelectedRadiusKm}
              height="550px"
              filterType="donations"
            />
          </div>
        ) : loading ? (
          <LoadingCards count={6} />
        ) : filteredDonations.length === 0 ? (
          <EmptyState
            title="No Matching Surplus Food Found"
            description="There are currently no available food donations matching your filters. Try widening your distance or food category."
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedCategory("all");
              setMaxDistance("all");
              setQuantityFilter("all");
              setTimeFilter("all");
              setSearchQuery("");
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDonations.map((item) => {
              const { text: timeRemaining, isUrgent } = formatTimeRemaining(item.expiresAt);

              return (
                <Card
                  key={item.id}
                  className="hover:shadow-md transition-all flex flex-col justify-between border-slate-200"
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Header Badges: Category & Distance & Urgency */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                        {item.foodType}
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          ~{item.distanceKm ?? Number((item.distanceMiles * 1.6).toFixed(1))} km ({item.distanceMiles} mi)
                        </span>

                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isUrgent
                              ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {timeRemaining}
                        </span>
                      </div>
                    </div>

                    {/* Food Name & Description */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {item.description || "Freshly cooked edible surplus food packaged for donation."}
                      </p>
                    </div>

                    {/* Quantity & Servings */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                        <Utensils className="w-4 h-4 text-emerald-600" />
                        <span>{item.servingsEstimate} Servings</span>
                      </div>
                      <span className="text-slate-500">
                        {item.quantity} {item.unit || "servings"}
                      </span>
                    </div>

                    {/* Pickup Requirement & Storage Specs */}
                    <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          <strong>Storage:</strong> {item.storageMethod || "Room Temperature"}
                        </span>
                      </div>

                      {/* Donor Information */}
                      <div className="flex items-start gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">{item.donorName}</strong>
                          <span className="text-slate-400 block text-[11px]">
                            {item.pickupAddress.street}, {item.pickupAddress.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Allergens Tags */}
                    {item.dietaryInfo && item.dietaryInfo.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.dietaryInfo.map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Claim Button */}
                    <div className="pt-3 border-t border-slate-100">
                      <Button
                        className="w-full"
                        size="sm"
                        disabled={!isVerified}
                        onClick={() => openClaimModal(item)}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        {isVerified ? "Request & Accept Food" : "Verification Required"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Claim Confirmation Modal */}
        {selectedDonation && (
          <Modal
            isOpen={!!selectedDonation}
            onClose={() => setSelectedDonation(null)}
            title="Confirm Surplus Food Acceptance"
          >
            <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-emerald-950">{selectedDonation.title}</h4>
                  <Badge status="available" size="sm" />
                </div>
                <p>
                  Donor: <strong>{selectedDonation.donorName}</strong> ({selectedDonation.donorPhone || "+1 555-234-8901"})
                </p>
                <p>
                  Pickup Address: <strong>{selectedDonation.pickupAddress.street}</strong>
                </p>
                <p>
                  Storage Requirement: <strong>{selectedDonation.storageMethod || "Standard Insulated"}</strong>
                </p>
              </div>

              {claimError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{claimError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Input
                  label="Portions to Accept (Full reservation model)"
                  type="number"
                  min={1}
                  max={selectedDonation.servingsEstimate}
                  value={requestedPortions}
                  onChange={(e) => setRequestedPortions(Number(e.target.value))}
                  helperText={`Maximum available from this donor: ${selectedDonation.servingsEstimate} portions`}
                  required
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">Coordination Protocol:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Atomic reservation prevents other NGOs from claiming this batch.</li>
                  <li>Local volunteer couriers are notified immediately to dispatch pickup.</li>
                  <li>Please ensure your receiving kitchen is prepared for intake within 45 minutes.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedDonation(null)}>
                  Cancel
                </Button>
                <Button size="sm" isLoading={claimLoading} onClick={handleConfirmClaim}>
                  Confirm Acceptance & Dispatch Courier
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Success Modal */}
        {claimedSuccess && (
          <Modal
            isOpen={!!claimedSuccess}
            onClose={() => setClaimedSuccess(null)}
            title="ShareBited & Courier Alerted!"
          >
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">{claimedSuccess.title}</h4>
                <p className="text-xs text-slate-500">
                  {claimedSuccess.servingsEstimate} portions reserved for your community shelter.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-left space-y-1">
                <p>
                  <strong>Donor Kitchen:</strong> {claimedSuccess.donorName}
                </p>
                <p>
                  <strong>Status:</strong> Courier Volunteer Dispatching
                </p>
                <p>
                  <strong>Destination:</strong> {user?.address?.street || "782 Mission Blvd"}
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <Link href="/ngo/accepted">
                  <Button size="sm">Track Delivery</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => setClaimedSuccess(null)}>
                  Browse More
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
