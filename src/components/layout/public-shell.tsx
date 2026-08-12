import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

/** Standard inner wrapper for simple public content pages. */
export function PublicPage({ children }: { children: ReactNode }) {
  return <div className="container-page space-y-10 py-12 sm:py-16">{children}</div>;
}
