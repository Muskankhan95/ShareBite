import { useState, type ReactNode } from "react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/common/logo";
import { roleLabels, roleNav, type NavItem } from "@/config/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/types";

function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: (() => void) | undefined }) {
  return (
    <nav aria-label="Workspace" className="flex flex-col gap-1">
      {items.map(({ label, to, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to as "/"}
          onClick={onNavigate}
          activeOptions={{ exact: Boolean(exact) }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground",
          }}
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function SidebarBody({ role, onNavigate }: { role: UserRole; onNavigate?: (() => void) | undefined }) {
  const { account, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (onNavigate) onNavigate();
    await signOut();
    await navigate({ to: "/login" });
  };

  const initials = account?.fullName
    ? account.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "SB";

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="space-y-3">
        <Logo />
        <Badge variant="outline" className="rounded-full bg-primary-soft text-secondary-foreground">
          {roleLabels[role]} workspace
        </Badge>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto">
        <SidebarNav items={roleNav[role]} onNavigate={onNavigate} />
      </div>
      <Separator />
      <div className="space-y-3">
        {account ? (
          <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-2.5">
            <Avatar className="size-8 ring-1 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">
                {account.fullName || "User"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{account.email}</p>
            </div>
          </div>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30"
          onClick={handleSignOut}
        >
          <LogOut className="size-3.5" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function DashboardShell({ role, children }: { role: UserRole; children?: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar p-5 lg:sticky lg:top-0 lg:block lg:h-screen">
        <SidebarBody role={role} />
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-5 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open workspace menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-xs bg-sidebar p-5">
              <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
              <SidebarBody role={role} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-display text-sm font-semibold">
            {roleLabels[role]} workspace
          </span>
        </header>

        <main className="flex-1 px-5 py-8 sm:px-8">
          <div className="mx-auto w-full max-w-6xl space-y-8">{children ?? <Outlet />}</div>
        </main>
      </div>
    </div>
  );
}
