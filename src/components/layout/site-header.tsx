import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { publicNav } from "@/config/navigation";
import { Logo } from "@/components/common/logo";
import { useAuth, roleHome } from "@/lib/auth/auth-context";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, account, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    await navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {publicNav.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/"}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated && account ? (
            <>
              <Button asChild variant="hero" size="sm">
                <Link to={roleHome[account.role] as "/"}>
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} title="Sign out">
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="mt-2 flex flex-col gap-1">
              {publicNav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to as "/"}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "text-foreground bg-muted" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 grid gap-2">
                {isAuthenticated && account ? (
                  <>
                    <Button asChild variant="hero" onClick={() => setOpen(false)}>
                      <Link to={roleHome[account.role] as "/"}>
                        <LayoutDashboard className="size-4" />
                        Go to Dashboard
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={handleSignOut}>
                      <LogOut className="size-4" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" onClick={() => setOpen(false)}>
                      <Link to="/login">Log in</Link>
                    </Button>
                    <Button asChild variant="hero" onClick={() => setOpen(false)}>
                      <Link to="/register">Get started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
