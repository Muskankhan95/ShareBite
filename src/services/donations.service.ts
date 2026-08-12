import { notImplemented } from "./api-client";
import type { Donation } from "@/types";

export const donationsService = {
  list: () => notImplemented<Donation[]>("Listing donations"),
  getById: (_id: string) => notImplemented<Donation>("Donation details"),
  create: (_input: Partial<Donation>) => notImplemented<Donation>("Creating a donation"),
  cancel: (_id: string) => notImplemented<void>("Cancelling a donation"),
};
