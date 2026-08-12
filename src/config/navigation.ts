import {
  BarChart3,
  Building2,
  ClipboardList,
  FileBarChart,
  Handshake,
  History,
  Home,
  Inbox,
  MapPin,
  Package,
  PackagePlus,
  Truck,
  UserCircle,
  Users,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export const publicNav: { label: string; to: string }[] = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "Contact", to: "/contact" },
];

export const roleNav: Record<UserRole, NavItem[]> = {
  donor: [
    { label: "Dashboard", to: "/donor", icon: Home, exact: true },
    { label: "Create Donation", to: "/donor/donations/new", icon: PackagePlus },
    { label: "My Donations", to: "/donor/donations", icon: Package },
    { label: "Donation History", to: "/donor/history", icon: History },
    { label: "Profile", to: "/donor/profile", icon: UserCircle },
  ],
  ngo: [
    { label: "Dashboard", to: "/ngo", icon: Home, exact: true },
    { label: "Nearby Food", to: "/ngo/nearby", icon: MapPin },
    { label: "Food Requests", to: "/ngo/requests", icon: Inbox },
    { label: "Accepted Donations", to: "/ngo/accepted", icon: Handshake },
    { label: "Donation History", to: "/ngo/history", icon: History },
    { label: "Profile", to: "/ngo/profile", icon: UserCircle },
  ],
  volunteer: [
    { label: "Dashboard", to: "/volunteer", icon: Home, exact: true },
    { label: "Available Pickups", to: "/volunteer/pickups", icon: Package },
    { label: "My Pickups", to: "/volunteer/my-pickups", icon: Truck },
    { label: "Delivery History", to: "/volunteer/history", icon: History },
    { label: "Profile", to: "/volunteer/profile", icon: UserCircle },
  ],
  admin: [
    { label: "Dashboard", to: "/admin", icon: Home, exact: true },
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "NGOs", to: "/admin/ngos", icon: Building2 },
    { label: "Donations", to: "/admin/donations", icon: ClipboardList },
    { label: "Volunteers", to: "/admin/volunteers", icon: Truck },
    { label: "Reports", to: "/admin/reports", icon: FileBarChart },
    { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  ],
};

export const roleLabels: Record<UserRole, string> = {
  donor: "Donor",
  ngo: "NGO",
  volunteer: "Volunteer",
  admin: "Admin",
};
