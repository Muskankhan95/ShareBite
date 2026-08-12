import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/common/logo";
import { site } from "@/config/site";
import { publicNav } from "@/config/navigation";

const roleLinks = [
  { label: "Donor area", to: "/donor" },
  { label: "NGO area", to: "/ngo" },
  { label: "Volunteer area", to: "/volunteer" },
  { label: "Admin area", to: "/admin" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/50">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {site.description}
          </p>
        </div>

        <nav aria-label="Site" className="space-y-3 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Platform
          </h2>
          <ul className="space-y-2">
            {publicNav.map((item) => (
              <li key={item.to}>
                <Link to={item.to as "/"} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Workspaces" className="space-y-3 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Workspaces
          </h2>
          <ul className="space-y-2">
            {roleLinks.map((item) => (
              <li key={item.to}>
                <Link to={item.to as "/"} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contact
          </h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>{site.email}</li>
            <li>{site.phone}</li>
            <li>{site.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 py-6">
        <p className="container-page text-xs text-muted-foreground">
          © {new Date().getFullYear()} {site.name}. Built to keep good food out of landfills.
        </p>
      </div>
    </footer>
  );
}
