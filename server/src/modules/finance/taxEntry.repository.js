import { desc, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { taxEntries } from "./taxEntry.schema.js";

const taxEntrySelection = {
  id: taxEntries.id,
  amount: taxEntries.amount,
  date: taxEntries.date,
  note: taxEntries.note,
  billKey: taxEntries.billKey,
  createdAt: taxEntries.createdAt,
  updatedAt: taxEntries.updatedAt,
};

export const listTaxEntries = async () => {
  return db.select(taxEntrySelection).from(taxEntries).orderBy(desc(taxEntries.date));
};

export const findTaxEntryById = async (id) => {
  const rows = await db.select(taxEntrySelection).from(taxEntries).where(eq(taxEntries.id, id));

  return rows[0];
};

export const createTaxEntry = async ({ amount, date, note, billKey }) => {
  const id = uuidv7();

  await db.insert(taxEntries).values({ id, amount, date, note: note || null, billKey: billKey || null });

  return findTaxEntryById(id);
};

export const deleteTaxEntry = async (id) => {
  await db.delete(taxEntries).where(eq(taxEntries.id, id));
};
