export const siteConfig = {
  name: "ShareBite",
  description:
    "ShareBite is a social-impact platform that connects people and businesses with surplus edible food to verified NGOs and community organizations through volunteers.",
  hero: {
    heading: "Save Food. Share Hope.",
    subtitle:
      "ShareBite connects surplus food with verified organizations and volunteers before it goes to waste.",
    primaryActions: [
      { label: "Donate Food", href: "/register?role=donor", primary: true },
      { label: "Join as Volunteer", href: "/register?role=volunteer", primary: true },
    ],
    secondaryAction: {
      label: "Find Food",
      href: "/register?role=ngo",
    },
  },
  impactStats: [
    {
      label: "Meals Rescued",
      value: "148,500+",
      subtext: "Nutritious meals diverted from landfills",
      numeric: 148500,
    },
    {
      label: "Food Saved",
      value: "62,400 kg",
      subtext: "High-grade surplus recovered",
      numeric: 62400,
    },
    {
      label: "Active Donors",
      value: "380+",
      subtext: "Restaurants, hotels & institutions",
      numeric: 380,
    },
    {
      label: "Successful Deliveries",
      value: "12,940",
      subtext: "Delivered promptly by volunteers",
      numeric: 12940,
    },
  ],
  theProblem: {
    tagline: "The Global Food Paradox",
    title: "1/3rd of produced food is wasted, while millions face daily food insecurity.",
    points: [
      {
        title: "Tremendous Food Wastage",
        description:
          "Commercial kitchens, hotels, and college hostels routinely prepare surplus food that is discarded despite being fresh and hygienic.",
      },
      {
        title: "Logistical Bottlenecks",
        description:
          "Shelters and NGOs often lack the immediate transport or notice to pick up food before it degrades or expires.",
      },
      {
        title: "Environmental Damage",
        description:
          "Decomposing food in municipal landfills produces potent methane gas, worsening the climate crisis.",
      },
    ],
  },
  howItWorks: [
    {
      step: "01",
      title: "List Surplus Food",
      role: "Donor",
      description:
        "Restaurants, hotels, canteens, or individuals post surplus food in under 2 minutes with portions, expiry window, and pickup location.",
    },
    {
      step: "02",
      title: "Match & Claim",
      role: "NGO",
      description:
        "Verified NGOs get notified of nearby food matches, review dietary suitability, and instantly claim portions for their community.",
    },
    {
      step: "03",
      title: "Rapid Volunteer Pickup",
      role: "Volunteer",
      description:
        "Nearby volunteer couriers receive pickup routing, safely transport the sealed food packages, and deliver them to the shelter.",
    },
    {
      step: "04",
      title: "Verified Delivery & Impact",
      role: "Platform",
      description:
        "QR codes confirm safe handover. Donors and volunteers receive verifiable real-time impact logs and carbon reduction certificates.",
    },
  ],
  whoCanUse: [
    {
      role: "Donors",
      target: "Restaurants, Hotels, College Canteens, Hostels, Event Organizers, Individuals",
      description:
        "Zero-hassle donation flow with tax receipts, CSR impact dashboards, and doorstep volunteer pickup.",
      badge: "Food Providers",
      href: "/register?role=donor",
    },
    {
      role: "Verified NGOs",
      target: "Orphanages, Homeless Shelters, Community Kitchens, Disaster Relief Teams",
      description:
        "Access free, inspected surplus food to feed more people daily without exhausting tight operating budgets.",
      badge: "Receivers",
      href: "/register?role=ngo",
    },
    {
      role: "Volunteers",
      target: "Students, Cyclists, Commuters, Community Champions",
      description:
        "Rescue food on your schedule. Receive bite-sized pickup missions near you with GPS route tracking.",
      badge: "Rescuers",
      href: "/register?role=volunteer",
    },
    {
      role: "Platform Admins",
      target: "Verification Officers, Community Managers, Quality Audits",
      description:
        "Verify NGO legal registrations, inspect flagged reports, monitor city-wide logistics, and analyze sustainability metrics.",
      badge: "Governance",
      href: "/login",
    },
  ],
  environmentalImpact: [
    { metric: "118,560 kg", label: "CO2e Greenhouse Gas Avoided" },
    { metric: "48.2 Million Liters", label: "Embedded Water Conserved" },
    { metric: "99.4%", label: "Safe Redistribution Rate" },
    { metric: "42 Mins", label: "Average Dispatch-to-Delivery Time" },
  ],
};
