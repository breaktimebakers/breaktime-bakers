import { httpError } from "../../utils/httpError.js";
import { createReadUrl } from "../../utils/objectStorage.js";
import * as taxEntryRepo from "./taxEntry.repository.js";

const requireTaxEntry = async (id) => {
  const entry = await taxEntryRepo.findTaxEntryById(id);

  if (!entry) {
    throw httpError(404, "Tax entry not found");
  }

  return entry;
};

// The bucket is private - a stored billKey is never handed to the client
// as-is, only swapped for a short-lived signed URL at read time.
const withSignedBillUrl = async (entry) => {
  if (!entry) return entry;

  const { billKey, ...rest } = entry;
  return { ...rest, billUrl: await createReadUrl(billKey) };
};

export const listTaxEntries = async () => {
  const list = await taxEntryRepo.listTaxEntries();
  return Promise.all(list.map(withSignedBillUrl));
};

export const createTaxEntry = async (body) => withSignedBillUrl(await taxEntryRepo.createTaxEntry(body));

export const deleteTaxEntry = async (id) => {
  await requireTaxEntry(id);

  await taxEntryRepo.deleteTaxEntry(id);
};
