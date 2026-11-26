"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole, DonorCategory } from "@/types/user";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RoleSwitcherBanner } from "@/components/shared/RoleSwitcherBanner";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Utensils,
  Building2,
  Bike,
  HeartHandshake,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Building,
} from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams?.get("role") as UserRole | null;
  const initialRole: UserRole =
    initialRoleParam === "ngo" || initialRoleParam === "volunteer" ? initialRoleParam : "donor";

  const { register, isAuthenticated, role: activeRole } = useAuth();

  // Core Form State
  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Role Specific State
  // NGO fields:
  const [ngoOrgName, setNgoOrgName] = useState("");
  const [ngoAddress, setNgoAddress] = useState("");
  const [ngoContactPerson, setNgoContactPerson] = useState("");

  // Donor fields (optional):
  const [donorOrgName, setDonorOrgName] = useState("");
  const [donorAddress, setDonorAddress] = useState("");
  const [donorCategory, setDonorCategory] = useState<DonorCategory>("Restaurant");

  // Volunteer fields:
  const [volunteerAddress, setVolunteerAddress] = useState("");
  const [volunteerVehicle, setVolunteerVehicle] = useState("Bike");

  // Validation & Error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated && activeRole) {
      router.push(`/${activeRole}/dashboard`);
    }
  }, [isAuthenticated, activeRole, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    setServerError("");

    if (!name.trim()) {
      newErrors.name = "Full name is required.";
    }

    const emailTrim = email.trim();
    if (!emailTrim) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (phone.trim().length < 7) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    // Role-specific validation
    if (role === "ngo") {
      if (!ngoOrgName.trim()) {
        newErrors.ngoOrgName = "Organization name is required for NGOs.";
      }
      if (!ngoAddress.trim()) {
        newErrors.ngoAddress = "Organization address is required for NGOs.";
      }
      if (!ngoContactPerson.trim()) {
        newErrors.ngoContactPerson = "Contact person name is required for NGOs.";
      }
    }

    if (role === "volunteer") {
      if (!volunteerAddress.trim()) {
        newErrors.volunteerAddress = "Address / Service area is required for volunteers.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError("");

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        confirmPassword,
        role,
        organizationName:
          role === "ngo"
            ? ngoOrgName.trim()
            : role === "donor"
            ? donorOrgName.trim()
            : undefined,
        address:
          role === "ngo"
            ? ngoAddress.trim()
            : role === "donor"
            ? donorAddress.trim()
            : volunteerAddress.trim(),
        contactPerson: role === "ngo" ? ngoContactPerson.trim() : undefined,
        donorCategory: role === "donor" ? donorCategory : undefined,
        volunteerVehicleType: role === "volunteer" ? volunteerVehicle : undefined,
      };

      const result = await register(payload);

      if (!result.success) {
        setServerError(result.error || "Registration failed. Please try again.");
      } else {
        router.push(result.destination || `/${role}/dashboard`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-md">
          <HeartHandshake className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Create Your ShareBite Account
        </h1>
        <p className="text-xs text-slate-500">
          Join our verified network to prevent food waste and nourish local communities
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-200/80 p-1.5 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setRole("donor");
            setErrors({});
            setServerError("");
          }}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            role === "donor"
              ? "bg-white text-emerald-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Donor</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole("ngo");
            setErrors({});
            setServerError("");
          }}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            role === "ngo"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>NGO</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole("volunteer");
            setErrors({});
            setServerError("");
          }}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            role === "volunteer"
              ? "bg-white text-amber-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Volunteer</span>
        </button>
      </div>

      <Card className="shadow-lg border-slate-200">
        <CardContent className="p-6 sm:p-8 space-y-5">
          {/* Server Error Alert */}
          {serverError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Core Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Marco Rivera"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                error={errors.name}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                }}
                error={errors.phone}
                leftIcon={<Phone className="w-4 h-4" />}
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                }}
                error={errors.password}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                error={errors.confirmPassword}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            {/* Role Specific Section */}
            {role === "ngo" && (
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>NGO Organization Details (Required)</span>
                </div>

                <Input
                  label="Organization / Shelter Name"
                  placeholder="e.g. Hope Kitchen & Shelter"
                  value={ngoOrgName}
                  onChange={(e) => {
                    setNgoOrgName(e.target.value);
                    if (errors.ngoOrgName) setErrors((prev) => ({ ...prev, ngoOrgName: "" }));
                  }}
                  error={errors.ngoOrgName}
                  required
                />

                <Input
                  label="Organization Address"
                  placeholder="Physical street address, city, state, zip"
                  value={ngoAddress}
                  onChange={(e) => {
                    setNgoAddress(e.target.value);
                    if (errors.ngoAddress) setErrors((prev) => ({ ...prev, ngoAddress: "" }));
                  }}
                  error={errors.ngoAddress}
                  leftIcon={<MapPin className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Organization Contact Person"
                  placeholder="Name of food coordinator / director"
                  value={ngoContactPerson}
                  onChange={(e) => {
                    setNgoContactPerson(e.target.value);
                    if (errors.ngoContactPerson) setErrors((prev) => ({ ...prev, ngoContactPerson: "" }));
                  }}
                  error={errors.ngoContactPerson}
                  required
                />
              </div>
            )}

            {role === "donor" && (
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <span>Donor Establishment Details (Optional)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Business / Kitchen Name"
                    placeholder="e.g. Green Leaf Bistro (optional)"
                    value={donorOrgName}
                    onChange={(e) => setDonorOrgName(e.target.value)}
                  />

                  <Select
                    label="Donor Category"
                    value={donorCategory}
                    onChange={(e) => setDonorCategory(e.target.value as DonorCategory)}
                    options={[
                      { value: "Restaurant", label: "Restaurant" },
                      { value: "Hotel", label: "Hotel / Banquet" },
                      { value: "College Canteen", label: "College Canteen" },
                      { value: "Hostel", label: "Hostel Dining" },
                      { value: "Event Organizer", label: "Event Organizer / Caterer" },
                      { value: "Individual", label: "Individual Household" },
                    ]}
                  />
                </div>

                <Input
                  label="Pickup Address / Kitchen Location"
                  placeholder="Default address for surplus pickups (optional)"
                  value={donorAddress}
                  onChange={(e) => setDonorAddress(e.target.value)}
                  leftIcon={<MapPin className="w-4 h-4" />}
                />
              </div>
            )}

            {role === "volunteer" && (
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                  <Bike className="w-4 h-4 text-amber-600" />
                  <span>Volunteer Courier Logistics (Required)</span>
                </div>

                <Input
                  label="Address / Service Location"
                  placeholder="Your base neighborhood or street address"
                  value={volunteerAddress}
                  onChange={(e) => {
                    setVolunteerAddress(e.target.value);
                    if (errors.volunteerAddress) setErrors((prev) => ({ ...prev, volunteerAddress: "" }));
                  }}
                  error={errors.volunteerAddress}
                  leftIcon={<MapPin className="w-4 h-4" />}
                  required
                />

                <Select
                  label="Primary Transport Mode"
                  value={volunteerVehicle}
                  onChange={(e) => setVolunteerVehicle(e.target.value)}
                  options={[
                    { value: "Bike", label: "Bicycle / E-Bike" },
                    { value: "Car", label: "Personal Car" },
                    { value: "Van", label: "Van / Large Vehicle" },
                    { value: "On Foot", label: "On Foot (Within walking distance)" },
                  ]}
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-2"
              size="md"
              isLoading={isLoading}
            >
              Register as {role.toUpperCase()}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-500">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
          Sign in to your account
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <RoleSwitcherBanner />
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm">Loading registration...</div>}>
          <RegisterForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
