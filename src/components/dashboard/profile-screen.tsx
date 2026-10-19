import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, Clock, ShieldX, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { roleLabels } from "@/config/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { updateMyProfile } from "@/lib/data.functions";
import type { UserRole } from "@/types";

/** Shared profile screen used by every role workspace with real data and update capability. */
export function ProfileScreen({
  role,
  extraFields = [],
}: {
  role: UserRole;
  extraFields?: { id: string; label: string; placeholder?: string }[];
}) {
  const { account } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    organizationName: "",
    organizationAddress: "",
    organizationContactPerson: "",
  });

  useEffect(() => {
    if (account) {
      setFormData({
        fullName: account.fullName || "",
        phone: account.phone || "",
        address: account.address || "",
        organizationName: account.organizationName || "",
        organizationAddress: account.organizationAddress || "",
        organizationContactPerson: account.organizationContactPerson || "",
      });
    }
  }, [account]);

  const initials = account?.fullName
    ? account.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "SB";

  const verificationStatus =
    role === "ngo"
      ? account?.ngoProfile?.verificationStatus
      : role === "volunteer"
      ? account?.volunteerProfile?.verificationStatus
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateMyProfile({
        data: {
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          organizationName: formData.organizationName || undefined,
          organizationAddress: formData.organizationAddress || undefined,
          organizationContactPerson: formData.organizationContactPerson || undefined,
        },
      });
      toast.success("Profile saved successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Profile & Settings"
        description={`Manage your ${roleLabels[role]} account details and contact information.`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="space-y-6">
          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-lg">Account details</CardTitle>
              <CardDescription>Role and authentication status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="size-16 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary-soft text-lg font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    {account?.fullName || "ShareBite User"}
                  </p>
                  <p className="text-xs text-muted-foreground">{account?.email}</p>
                  <Badge variant="outline" className="mt-1 capitalize bg-primary/10 text-primary">
                    {roleLabels[role]}
                  </Badge>
                </div>
              </div>

              {verificationStatus ? (
                <div className="rounded-xl border border-border p-3.5 space-y-1 bg-muted/30">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Verification Status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {verificationStatus === "verified" ? (
                      <>
                        <ShieldCheck className="size-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          Verified Organization
                        </span>
                      </>
                    ) : verificationStatus === "rejected" ? (
                      <>
                        <ShieldX className="size-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Application Rejected</span>
                      </>
                    ) : (
                      <>
                        <Clock className="size-4 text-amber-600 animate-pulse" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          Verification Pending Review
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-lg">Edit profile information</CardTitle>
            <CardDescription>Keep your contact details up to date for coordinated food handoffs.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Asha Kumar"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" value={account?.email ?? ""} disabled className="bg-muted/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 90000 00000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address / City</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="12 Park Road, Bengaluru"
                />
              </div>

              {role === "ngo" || role === "donor" ? (
                <>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="organizationName">Organization name</Label>
                    <Input
                      id="organizationName"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      placeholder="e.g. Green Leaf Cafe / Anna Seva Trust"
                    />
                  </div>

                  {role === "ngo" ? (
                    <>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="organizationAddress">Organization address</Label>
                        <Input
                          id="organizationAddress"
                          value={formData.organizationAddress}
                          onChange={(e) =>
                            setFormData({ ...formData, organizationAddress: e.target.value })
                          }
                          placeholder="Distribution center address"
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="organizationContactPerson">Contact person / In-charge</Label>
                        <Input
                          id="organizationContactPerson"
                          value={formData.organizationContactPerson}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              organizationContactPerson: e.target.value,
                            })
                          }
                          placeholder="e.g. Rahul Sharma"
                        />
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}

              {extraFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <Input id={field.id} placeholder={field.placeholder ?? ""} />
                </div>
              ))}

              <div className="sm:col-span-2 pt-2">
                <Button type="submit" variant="hero" disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {loading ? "Saving changes…" : "Save profile changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
