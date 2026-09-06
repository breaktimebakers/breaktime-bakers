import { z } from "zod";
import { isoDateSchema as isoDate } from "../../utils/isoDate.js";

// Mirrors client/src/features/finance/data/seedFinance.js's expenseCategories
// labels - the client only ever offers these via a closed <select>, so this
// is validated as a fixed set here too, same as storeType/worker role.
const EXPENSE_CATEGORIES = [
  "Electricity",
  "Water",
  "Gas / Fuel",
  "Rent / Maintenance",
  "Internet & Phone",
  "Cleaning & Hygiene",
  "Repairs & Maintenance",
  "Transport / Fuel",
  "Packaging",
  "Printing & Stationery",
  "Software / Subscriptions",
  "Marketing",
  "Government / Licences",
  "Banking Charges",
  "Professional Fees",
  "Insurance",
  "Staff Welfare",
  "Worker Tips / Bonus",
  "Travel",
  "Equipment / Small Purchases",
  "Wastage / Loss",
  "Miscellaneous",
];

export const expenseIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: isoDate,
  note: z.string().trim().max(500).optional(),
  billKey: z.string().trim().max(500).optional(),
});
