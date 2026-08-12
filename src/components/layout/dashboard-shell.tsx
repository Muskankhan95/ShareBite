import { useState, type ReactNode } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/common/logo";
import { roleLabels, roleNav, type NavItem } from "@/config/navigation";
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
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          You are browsing the UI preview. Accounts and sign-in are not connected yet.
        </p>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to="/">
            <LogOut className="size-4" />
            Exit workspace
          </Link>
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
