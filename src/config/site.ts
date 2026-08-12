export const site = {
  name: "FoodRescue",
  tagline: "Save Food. Share Hope.",
  description:
    "FoodRescue connects surplus food with verified organizations and volunteers before it goes to waste.",
  email: "hello@foodrescue.org",
  phone: "+91 90000 00000",
  address: "12 Community Lane, Bengaluru, India",
} as const;

/** Feature flags — everything backend-dependent is off until implemented. */
export const features = {
  auth: false,
  donations: false,
  pickups: false,
  analytics: false,
  notifications: false,
} as const;
