"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingCards } from "@/components/ui/LoadingState";
import { useAuth } from "@/lib/auth/auth-context";
import { ngoService } from "@/lib/services/ngo.service";
import LocationPicker from "@/components/map/LocationPicker";
import { NGOProfile, NGOVerificationStatus } from "@/types/ngo";
import { FoodCategory } from "@/types/donation";
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Save,
  AlertCircle,
  Clock,
  MapPin,
  Utensils,
  Layers,
  Sparkles,
} from "lucide-react";

const FOOD_CATEGORY_OPTIONS: FoodCategory[] = [
  "Cooked meals",
  "Rice",
  "Bread/roti",
  "Fruits",
  "Vegetables",
  "Bakery",
  "Packaged food",
  "Other",
];

export default function NGOProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<NGOProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [orgName, setOrgName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number>(37.7858);
  const [longitude, setLongitude] = useState<number>(-122.4042);
  const [hours, setHours] = useState("");
  const [capacity, setCapacity] = useState<number>(100);
  const [currentRequirement, setCurrentRequirement] = useState<number>(50);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Cooked meals", "Rice"]);
  const [verificationStatus, setVerificationStatus] = useState<NGOVerificationStatus>("verified");

  const loadProfile = async () => {
    try {
      const ngoUserId = user?.id || "usr_ngo_1";
      const data = await ngoService.getNgoProfile(ngoUserId);
      if (data) {
        setProfile(data);
        setOrgName(data.name || data.organizationName || "Hope Kitchen & Shelter");
        setRegNo(data.registrationNumber || "NGO-501C3-88204");
        setContactName(data.contactPerson || "Elena Rostova");
        setPhone(data.phone || "+1 (555) 876-5432");
        setAddress(data.address || "782 Mission Blvd, San Francisco, CA");
        if (data.latitude && data.longitude) {
          setLatitude(data.latitude);
          setLongitude(data.longitude);
        }
        setHours(data.operationalHours || "7:00 AM - 9:00 PM");
        setCapacity(data.capacityPerDay || 200);
        setCurrentRequirement(data.currentRequirement || 75);
        setSelectedCategories(data.foodPreferences || ["Cooked meals", "Rice"]);
        setVerificationStatus(data.verificationStatus || "verified");
      }
    } catch (err: any) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const ngoUserId = user?.id || "usr_ngo_1";
      const updated = await ngoService.updateNgoProfile(ngoUserId, {
        organizationName: orgName.trim(),
        contactPerson: contactName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        latitude,
        longitude,
        operationalHours: hours.trim(),
        capacity: Number(capacity),
        currentRequirement: Number(currentRequirement),
        preferredCategories: selectedCategories,
        verificationStatus,
      });

      setProfile(updated);
      setSuccessMessage("NGO capacity, preferences, and profile updated successfully in the database!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update NGO profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="ngo" title="NGO Profile & Capacity">
        <LoadingCards count={1} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="ngo"
      title="NGO Capacity & Organization Profile"
      description="Configure daily meal capacity, current community food requirement, and preferred categories for smart matching."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-8">
              {/* Header: Organization Identity & Verification Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{orgName}</h3>
                    <p className="text-xs text-slate-500">Registration ID: {regNo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Status:</span>
                  <Badge
                    variant={
                      verificationStatus === "verified"
                        ? "success"
                        : verificationStatus === "pending"
                        ? "warning"
                        : "danger"
                    }
                    dot
                  >
                    {verificationStatus}
                  </Badge>
                </div>
              </div>

              {/* 1. NGO Capacity & Requirement (Exact Prompt Requirements) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Utensils className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    1. Daily Meal Capacity & Intake Target
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Maximum Meal Capacity (Servings/Day) *"
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    helperText="Total daily meal serving capacity of your kitchen / shelter"
                    required
                  />

                  <Input
                    label="Current Daily Requirement (Meals Needed Today) *"
                    type="number"
                    min={0}
                    value={currentRequirement}
                    onChange={(e) => setCurrentRequirement(Number(e.target.value))}
                    helperText="Active portion requirement needed today for shelter guests"
                    required
                  />
                </div>

                {/* Preferred Food Categories */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                    Preferred Food Categories (Used for Smart Matching)
                  </label>
                  <p className="text-xs text-slate-500 mb-2.5">
                    Select categories that your facility has proper cold chain or warming facilities to safely receive:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FOOD_CATEGORY_OPTIONS.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                            isSelected
                              ? "bg-blue-50 border-blue-300 text-blue-800 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Verification Status Setting & Demonstration Switcher */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    2. NGO Verification Status
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Select
                      label="Verification State"
                      value={verificationStatus}
                      onChange={(e) => setVerificationStatus(e.target.value as NGOVerificationStatus)}
                      options={[
                        { value: "verified", label: "Verified (Authorized to claim donations)" },
                        { value: "pending", label: "Pending (Under administrative review)" },
                        { value: "rejected", label: "Rejected (Documentation rejected)" },
                        { value: "suspended", label: "Suspended (Temporarily inactive)" },
                      ]}
                      helperText="Toggle to test unverified restrictions or verified capabilities."
                    />
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-900">Verification Rule:</p>
                    <p>
                      Only NGOs marked <strong>Verified</strong> can reserve, request, and receive food donations.
                      In Pending, Rejected, or Suspended states, claim actions are automatically blocked.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Facility Logistics & Contact */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    3. Intake Facility & Delivery Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <LocationPicker
                      label="Intake Facility Address & Map Pin"
                      address={address}
                      latitude={latitude}
                      longitude={longitude}
                      onLocationChange={(loc) => {
                        setAddress(loc.address);
                        setLatitude(loc.latitude);
                        setLongitude(loc.longitude);
                      }}
                      required
                    />
                  </div>

                  <div>
                    <Input
                      label="Intake Coordinator Name *"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Input
                      label="Coordinator Direct Phone *"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Receiving Hours *"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="e.g. 7:00 AM - 9:00 PM"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button type="submit" isLoading={saveLoading} leftIcon={<Save className="w-4 h-4" />}>
                  Save NGO Profile & Capacity
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
