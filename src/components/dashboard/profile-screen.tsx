import { PageHeader } from "@/components/common/page-header";
import { NotImplementedPanel } from "@/components/common/not-implemented-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { roleLabels } from "@/config/navigation";
import type { UserRole } from "@/types";

/** Shared profile screen used by every role workspace. */
export function ProfileScreen({
  role,
  extraFields = [],
}: {
  role: UserRole;
  extraFields?: { id: string; label: string; placeholder?: string }[];
}) {
  return (
    <>
      <PageHeader
        title="Profile"
        description={`Account details for your ${roleLabels[role]} profile. Saving becomes available once accounts are connected.`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="border-border/70 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>No signed-in user during the UI stage.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-primary-soft text-primary">FR</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Not signed in</p>
              <p className="text-muted-foreground">{roleLabels[role]} workspace preview</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-lg">Profile details</CardTitle>
            <CardDescription>Fields this role will manage.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" placeholder="Asha Kumar" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="+91 90000 00000" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Bengaluru" disabled />
              </div>
              {extraFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <Input id={field.id} placeholder={field.placeholder ?? ""} disabled />
                </div>
              ))}
              <div className="sm:col-span-2">
                <Button type="submit" variant="hero" disabled>
                  Saving is not available yet
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <NotImplementedPanel
        feature="Profile management"
        planned={["Editable profile fields", "Avatar upload", "Notification preferences", "Account deletion"]}
      />
    </>
  );
}
