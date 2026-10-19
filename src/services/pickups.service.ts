import {
  claimPickup,
  listAvailablePickups,
  listMyPickups,
  updatePickupStatus,
} from "@/lib/data.functions";

export const pickupsService = {
  listAvailable: () => listAvailablePickups(),
  listMine: () => listMyPickups(),
  accept: (id: string) => claimPickup({ data: { id } }),
  markPickedUp: (id: string) => updatePickupStatus({ data: { id, status: "picked_up" } }),
  markDelivered: (id: string) => updatePickupStatus({ data: { id, status: "delivered" } }),
};
