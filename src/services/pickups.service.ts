import { notImplemented } from "./api-client";
import type { Pickup } from "@/types";

export const pickupsService = {
  listAvailable: () => notImplemented<Pickup[]>("Available pickups"),
  listMine: () => notImplemented<Pickup[]>("My pickups"),
  accept: (_id: string) => notImplemented<void>("Accepting a pickup"),
  markDelivered: (_id: string) => notImplemented<void>("Marking a delivery complete"),
};
