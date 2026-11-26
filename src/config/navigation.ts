export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  description?: string;
}

export const publicNavItems: NavItem[] = [
  { title: "Home", href: "/", iconName: "Home" },
  { title: "Map", href: "/map", iconName: "MapPin" },
  { title: "About", href: "/about", iconName: "Info" },
  { title: "How It Works", href: "/how-it-works", iconName: "HelpCircle" },
  { title: "Contact", href: "/contact", iconName: "Mail" },
];

export const donorNavItems: NavItem[] = [
  { title: "Donor Dashboard", href: "/donor/dashboard", iconName: "LayoutDashboard" },
  { title: "Create Donation", href: "/donor/create", iconName: "PlusCircle", badge: "New" },
  { title: "My Donations", href: "/donor/my-donations", iconName: "Package" },
  { title: "Donation History", href: "/donor/history", iconName: "Clock" },
  { title: "Profile", href: "/donor/profile", iconName: "User" },
];

export const ngoNavItems: NavItem[] = [
  { title: "NGO Dashboard", href: "/ngo/dashboard", iconName: "LayoutDashboard" },
  { title: "Nearby Food", href: "/ngo/nearby", iconName: "MapPin", badge: "Live" },
  { title: "Food Requests", href: "/ngo/requests", iconName: "ClipboardList" },
  { title: "Accepted Donations", href: "/ngo/accepted", iconName: "CheckCircle2" },
  { title: "Donation History", href: "/ngo/history", iconName: "Archive" },
  { title: "Profile", href: "/ngo/profile", iconName: "Building2" },
];

export const volunteerNavItems: NavItem[] = [
  { title: "Volunteer Dashboard", href: "/volunteer/dashboard", iconName: "LayoutDashboard" },
  { title: "Available Pickups", href: "/volunteer/available", iconName: "Bike", badge: "Active" },
  { title: "My Pickups", href: "/volunteer/my-pickups", iconName: "Navigation" },
  { title: "Delivery History", href: "/volunteer/history", iconName: "CheckSquare" },
  { title: "Profile", href: "/volunteer/profile", iconName: "UserCheck" },
];

export const adminNavItems: NavItem[] = [
  { title: "Admin Dashboard", href: "/admin/dashboard", iconName: "ShieldAlert" },
  { title: "Users", href: "/admin/users", iconName: "Users" },
  { title: "NGOs", href: "/admin/ngos", iconName: "Building", badge: "3 Pending" },
  { title: "Donations", href: "/admin/donations", iconName: "PackageCheck" },
  { title: "Volunteers", href: "/admin/volunteers", iconName: "HeartHandshake" },
  { title: "Reports", href: "/admin/reports", iconName: "AlertTriangle", badge: "Alert" },
  { title: "Analytics", href: "/admin/analytics", iconName: "BarChart3" },
];
