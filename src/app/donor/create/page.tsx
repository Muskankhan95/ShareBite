"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { donationService } from "@/lib/services/donation.service";
import { useAuth } from "@/lib/auth/auth-context";
import LocationPicker from "@/components/map/LocationPicker";
import { FoodCategory, QuantityUnit } from "@/types/donation";
import {
  Utensils,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Info,
  Sparkles,
  Camera,
  FileCheck,
} from "lucide-react";

const FOOD_CATEGORIES: FoodCategory[] = [
  "Cooked meals",
  "Rice",
  "Bread/roti",
  "Fruits",
  "Vegetables",
  "Bakery",
  "Packaged food",
  "Other",
];

const STORAGE_METHODS = [
  "Room Temperature (Dry, Cool)",
  "Refrigerated (Below 4°C / 40°F)",
  "Hot Insulated Warmer (Above 60°C / 140°F)",
  "Frozen (Below -18°C / 0°F)",
  "Bakery / Dry Sealed Box",
];

const ALLERGEN_OPTIONS = [
  "Gluten / Wheat",
  "Dairy / Milk",
  "Eggs",
  "Peanuts",
  "Tree Nuts",
  "Soybeans",
  "Fish / Shellfish",
  "Sesame",
  "Mustard",
  "Vegetarian",
  "Vegan",
  "Halal",
  "None / Allergen-Free",
];

const SAMPLE_IMAGE_PRESETS = [
  {
    label: "Cooked Meals",
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Rice & Grains",
    url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Bread & Bakery",
    url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Fresh Produce",
    url: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80",
  },
];

export default function CreateDonationPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Basic Details
  const [foodName, setFoodName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FoodCategory>("Cooked meals");
  const [quantity, setQuantity] = useState<number | string>(25);
  const [unit, setUnit] = useState<QuantityUnit>("servings");
  const [servings, setServings] = useState<number | string>(25);

  // Time & Perishability
  const defaultPrep = new Date().toISOString().slice(0, 16);
  const defaultAvail = new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16);
  const [preparationTime, setPreparationTime] = useState(defaultPrep);
  const [availableUntil, setAvailableUntil] = useState(defaultAvail);

  // Storage & Allergens
  const [storageMethod, setStorageMethod] = useState(STORAGE_METHODS[0]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(["Vegetarian"]);

  // Logistics & Image
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMAGE_PRESETS[0].url);
  const [street, setStreet] = useState(user?.address?.street || "420 Market Street");
  const [city, setCity] = useState(user?.address?.city || "San Francisco");
  const [state, setState] = useState(user?.address?.state || "CA");
  const [zipCode, setZipCode] = useState(user?.address?.zipCode || "94105");
  const [locationLandmark, setLocationLandmark] = useState("Kitchen Entrance, Loading Dock 2");
  const [latitude, setLatitude] = useState<number>(37.7915);
  const [longitude, setLongitude] = useState<number>(-122.3999);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Safety Declaration Checkbox States
  const [declaration1, setDeclaration1] = useState(false);
  const [declaration2, setDeclaration2] = useState(false);
  const [declaration3, setDeclaration3] = useState(false);
  const [declaration4, setDeclaration4] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allDeclarationsChecked = declaration1 && declaration2 && declaration3 && declaration4;

  const toggleAllergen = (item: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleFormSubmit = async (saveAsDraft: boolean) => {
    setErrorMessage(null);

    // Client-side Validations
    if (!foodName.trim()) {
      setErrorMessage("Please enter the food name.");
      return;
    }
    const qNum = Number(quantity);
    const sNum = Number(servings);
    if (isNaN(qNum) || qNum <= 0) {
      setErrorMessage("Quantity must be a positive number greater than 0.");
      return;
    }
    if (isNaN(sNum) || sNum <= 0) {
      setErrorMessage("Number of servings must be a positive integer greater than 0.");
      return;
    }
    if (!street.trim()) {
      setErrorMessage("Please enter the pickup address.");
      return;
    }
    if (!availableUntil) {
      setErrorMessage("Please select an available-until expiration time.");
      return;
    }

    const prepMs = new Date(preparationTime).getTime();
    const availMs = new Date(availableUntil).getTime();
    if (isNaN(availMs) || isNaN(prepMs)) {
      setErrorMessage("Invalid dates provided for preparation or availability.");
      return;
    }
    if (availMs <= prepMs) {
      setErrorMessage("Available-until time must be later than the preparation time.");
      return;
    }

    if (!saveAsDraft && !allDeclarationsChecked) {
      setErrorMessage("You must certify all four food safety declaration points before publishing.");
      return;
    }

    setIsLoading(true);
    try {
      await donationService.createDonation({
        donorId: user?.id || "usr_donor_1",
        donorName: user?.organizationName || user?.name || "Green Leaf Bistro",
        title: foodName.trim(),
        description: description.trim(),
        foodType: category,
        quantity: qNum,
        unit,
        servingsEstimate: sNum,
        preparationTime: new Date(preparationTime).toISOString(),
        availableUntil: new Date(availableUntil).toISOString(),
        storageMethod,
        dietaryInfo: selectedAllergens,
        imageUrl: imageUrl.trim() || undefined,
        pickupAddress: {
          street: `${street.trim()}${locationLandmark ? ` (${locationLandmark.trim()})` : ""}`,
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
        },
        latitude,
        longitude,
        locationName: locationLandmark,
        specialInstructions,
        safetyConfirmed: allDeclarationsChecked,
        status: saveAsDraft ? "draft" : "published",
      });

      router.push("/donor/my-donations");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create donation. Please check your inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      role="donor"
      title="Create Food Donation"
      description="List freshly prepared, surplus, or packaged food for verified NGOs and couriers."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Validation Error</p>
              <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* 1. Food Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Utensils className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  1. Food Item Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Food Name *"
                    placeholder="e.g. Fresh Vegetable Biryani with Raita & Salad"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Select
                    label="Food Category *"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FoodCategory)}
                    options={FOOD_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                  />
                </div>

                <div>
                  <Select
                    label="Storage Method *"
                    value={storageMethod}
                    onChange={(e) => setStorageMethod(e.target.value)}
                    options={STORAGE_METHODS.map((method) => ({ value: method, label: method }))}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Textarea
                    label="Food Description & Packaging"
                    placeholder="Detail the ingredients, preparation notes, and packaging (e.g. stored in sealed food-grade containers, chilled immediately)."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      label="Quantity *"
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-32">
                    <Select
                      label="Unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as QuantityUnit)}
                      options={[
                        { value: "servings", label: "servings" },
                        { value: "kg", label: "kg" },
                        { value: "boxes", label: "boxes" },
                        { value: "packets", label: "packets" },
                        { value: "meals", label: "meals" },
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <Input
                    label="Estimated Beneficiary Servings *"
                    type="number"
                    min={1}
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    helperText="Approximate people or meals this donation can feed"
                    required
                  />
                </div>
              </div>

              {/* Allergens selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                  Allergen & Dietary Declarations
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGEN_OPTIONS.map((tag) => {
                    const isSelected = selectedAllergens.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleAllergen(tag)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors ${
                          isSelected
                            ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Preparation Date & Available Until */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  2. Timing & Availability Window
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Preparation Date / Time *"
                    type="datetime-local"
                    value={preparationTime}
                    onChange={(e) => setPreparationTime(e.target.value)}
                    helperText="When the food was cooked or packed"
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Available Until (Safe Window) *"
                    type="datetime-local"
                    value={availableUntil}
                    onChange={(e) => setAvailableUntil(e.target.value)}
                    helperText="Must be later than preparation time"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 3. Image Selection / Upload */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Camera className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  3. Food Image
                </h3>
              </div>

              <div>
                <Input
                  label="Image URL"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  helperText="Provide an image URL or choose a preset photo below"
                />
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">Preset Food Photos:</p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`text-xs px-2.5 py-1 rounded-md border font-medium ${
                        imageUrl === preset.url
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Pickup Address & Location */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  4. Pickup Address & Logistics
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Street Address *"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. 420 Market Street"
                    required
                  />
                </div>

                <div>
                  <Input
                    label="City *"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="State *"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                  <Input
                    label="ZIP Code *"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Pickup Landmark / Location Details"
                    placeholder="e.g. Kitchen back entrance, service elevator B, ring buzzer #4"
                    value={locationLandmark}
                    onChange={(e) => setLocationLandmark(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <LocationPicker
                    label="Pinpoint Pickup Coordinates on Map"
                    address={`${street}, ${city}, ${state} ${zipCode}`.trim()}
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={(loc) => {
                      setLatitude(loc.latitude);
                      setLongitude(loc.longitude);
                    }}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Textarea
                    label="Special Instructions for Courier / NGO"
                    placeholder="e.g. Bring insulated cooler boxes; call kitchen upon arrival."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* 5. Food Safety Declaration */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  5. Food Safety Declaration
                </h3>
              </div>

              {/* Responsible Disclaimer Box */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-950">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Responsible Food Redistribution Notice</span>
                </div>
                <p className="leading-relaxed">
                  ShareBite serves as a community coordination platform connecting donors, non-profit
                  organizations, and volunteer couriers. <strong>ShareBite cannot inspect, certify, or guarantee the safety or quality of donated items.</strong> By
                  submitting this donation, the donor assumes sole responsibility for verifying that
                  the surplus food meets standard sanitary and hygienic requirements.
                </p>
              </div>

              {/* Mandatory Checklist Items */}
              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800">
                <p className="font-semibold text-slate-900">
                  Please certify the following before publishing:
                </p>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declaration1}
                    onChange={(e) => setDeclaration1(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <strong>Accurate Information:</strong> All quantities, servings, dates, and item
                    descriptions provided in this form are accurate and complete.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declaration2}
                    onChange={(e) => setDeclaration2(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <strong>Intended for Donation:</strong> The food is surplus, wholesome, unadulterated,
                    and intended solely for charitable donation to alleviate hunger.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declaration3}
                    onChange={(e) => setDeclaration3(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <strong>Proper Preparation & Storage:</strong> The food was prepared, packaged, and
                    stored in sanitary conditions according to the specified temperature method.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declaration4}
                    onChange={(e) => setDeclaration4(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <strong>Allergens Disclosed:</strong> All known primary allergens and dietary
                    elements present in this donation have been openly disclosed.
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => handleFormSubmit(true)}
                isLoading={isLoading}
              >
                Save as Draft
              </Button>

              <Button
                type="button"
                onClick={() => handleFormSubmit(false)}
                disabled={!allDeclarationsChecked || isLoading}
                isLoading={isLoading}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Publish Donation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
