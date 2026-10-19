import {
  cancelDonation,
  createDonation,
  getDonation,
  listMyDonations,
} from "@/lib/data.functions";

export const donationsService = {
  list: () => listMyDonations(),
  getById: (id: string) => getDonation({ data: { id } }),
  create: (input: Parameters<typeof createDonation>[0]["data"]) => createDonation({ data: input }),
  cancel: (id: string) => cancelDonation({ data: { id } }),
};
