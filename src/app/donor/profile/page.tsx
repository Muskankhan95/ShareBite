"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth/auth-context";
import { DonorCategory } from "@/types/user";
import { Building2, ShieldCheck, Save, CheckCircle2 } from "lucide-react";

export default function DonorProfilePage() {
  const { user } = useAuth();

  const [orgName, setOrgName] = useState(user?.organizationName || "Green Leaf Bistro");
  const [donorCategory, setDonorCategory] = useState<DonorCategory>(user?.donorCategory || "Restaurant");
  const [contactName, setContactName] = useState(user?.name || "Marco Rivera");
  const [phone, setPhone] = useState(user?.phone || "+1 (555) 234-8901");
  const [email, setEmail] = useState(user?.email || "marco@greenleafbistro.org");
  const [street, setStreet] = useState(user?.address.street || "420 Market Street");
  const [city, setCity] = useState(user?.address.city || "San Francisco");
  const [state, setState] = useState(user?.address.state || "CA");
  const [zipCode, setZipCode] = useState(user?.address.zipCode || "94105");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <DashboardLayout
      role="donor"
      title="Donor Profile & Settings"
      description="Manage your business verification details, default kitchen location, and notification preferences."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                    {orgName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{orgName}</h3>
                    <p className="text-xs text-slate-500">Registered Donor: {donorCategory}</p>
                  </div>
                </div>

                <Badge variant="success" dot>
                  Food Safety Certified
                </Badge>
              </div>

              {/* Organization Data */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Kitchen / Establishment Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Organization / Kitchen Name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                  />
                  <Select
                    label="Donor Classification"
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
              </div>

              {/* Contact Person */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Authorized Contact Person
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Contact Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                  <Input
                    label="Direct Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <Input
                    label="Official Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Default Location */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Default Pickup & Kitchen Address
                </h4>
                <Input
                  label="Street Address"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                />
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                  <Input
                    label="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                  <Input
                    label="ZIP Code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              {savedSuccess && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button type="submit" leftIcon={<Save className="w-4 h-4" />}>
                  Save Profile Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
