"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth/auth-context";
import { volunteerService } from "@/lib/services/volunteer.service";
import LocationPicker from "@/components/map/LocationPicker";
import {
  Bike,
  ShieldCheck,
  CheckCircle2,
  Save,
  Award,
  AlertCircle,
  Power,
  RotateCw,
} from "lucide-react";

export default function VolunteerProfilePage() {
  const { user } = useAuth();
  const userId = user?.id || "usr_vol_1";

  const [name, setName] = useState(user?.name || "Marcus Vance");
  const [phone, setPhone] = useState(user?.phone || "+1 (555) 456-7890");
  const [email, setEmail] = useState(user?.email || "marcus.vance@volunteer.org");
  const [address, setAddress] = useState("Downtown Service Base");
  const [latitude, setLatitude] = useState<number>(37.7702);
  const [longitude, setLongitude] = useState<number>(-122.4225);
  const [vehicle, setVehicle] = useState("Bike");
  const [preferredRadius, setPreferredRadius] = useState("5");
  const [availability, setAvailability] = useState<"available" | "unavailable">("available");
  const [verificationStatus, setVerificationStatus] = useState("verified");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const profile = await volunteerService.getProfile(userId);
        if (profile) {
          if (profile.address) setAddress(profile.address);
          if (profile.latitude && profile.longitude) {
            setLatitude(profile.latitude);
            setLongitude(profile.longitude);
          }
          if (profile.vehicleType) setVehicle(profile.vehicleType);
          if (profile.preferredRadius) setPreferredRadius(profile.preferredRadius.toString());
          if (profile.availabilityStatus) {
            setAvailability(profile.availabilityStatus === "unavailable" ? "unavailable" : "available");
          }
          if (profile.verificationStatus) setVerificationStatus(profile.verificationStatus);
        }
      } catch (err: any) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage(null);

      await volunteerService.updateProfile(userId, {
        address,
        latitude,
        longitude,
        vehicleType: vehicle,
        preferredRadius: parseInt(preferredRadius, 10),
      });

      await volunteerService.setAvailability(userId, availability);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      role="volunteer"
      title="Volunteer Courier Profile"
      description="Manage your transport equipment, delivery preferences, operating radius, and availability."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile and availability settings successfully saved to database.</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{name}</h3>
                    <p className="text-xs text-slate-500">Mode: {vehicle} Courier • {address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={verificationStatus === "verified" ? "success" : "warning"} dot>
                    {verificationStatus === "verified" ? "Verified Courier" : "Pending Verification"}
                  </Badge>
                  <Badge variant="info">Tier 1 Rescuer</Badge>
                </div>
              </div>

              {/* Courier Availability Setting */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Power className="w-3.5 h-3.5 text-emerald-600" />
                      Availability Status for Pickup Dispatch
                    </span>
                    <p className="text-xs text-slate-500">
                      When marked Available, you are eligible for automated mission matches and dispatch alerts.
                    </p>
                  </div>

                  <Select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as any)}
                    className="w-40"
                    options={[
                      { value: "available", label: "🟢 Available" },
                      { value: "unavailable", label: "⚪ Unavailable" },
                    ]}
                  />
                </div>
              </div>

              {/* Personal Data */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Mobile Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Vehicle & Radius */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Transport Equipment & Operational Radius
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    label="Vehicle Type"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    options={[
                      { value: "Bike", label: "Bicycle / E-Bike" },
                      { value: "Car", label: "Personal Car" },
                      { value: "Van", label: "Van / SUV" },
                      { value: "On Foot", label: "On Foot" },
                    ]}
                  />

                  <Select
                    label="Maximum Service Radius"
                    value={preferredRadius}
                    onChange={(e) => setPreferredRadius(e.target.value)}
                    options={[
                      { value: "2", label: "2 miles" },
                      { value: "5", label: "5 miles" },
                      { value: "10", label: "10 miles" },
                      { value: "25", label: "25 miles" },
                    ]}
                  />

                  </div>

                  <div className="pt-2">
                    <LocationPicker
                      label="Volunteer Operating Hub & Coordinates"
                      address={address}
                      latitude={latitude}
                      longitude={longitude}
                      isVolunteer={true}
                      onLocationChange={(loc) => {
                        setAddress(loc.address);
                        setLatitude(loc.latitude);
                        setLongitude(loc.longitude);
                      }}
                      required
                    />
                  </div>
                </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Profile Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
