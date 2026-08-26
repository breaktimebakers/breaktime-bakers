import { desc, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { expenses } from "./expense.schema.js";

const expenseSelection = {
  id: expenses.id,
  category: expenses.category,
  amount: expenses.amount,
  date: expenses.date,
  note: expenses.note,
  billKey: expenses.billKey,
  createdAt: expenses.createdAt,
  updatedAt: expenses.updatedAt,
};

export const listExpenses = async () => {
  return db.select(expenseSelection).from(expenses).orderBy(desc(expenses.date));
};

export const findExpenseById = async (id) => {
  const rows = await db.select(expenseSelection).from(expenses).where(eq(expenses.id, id));

  return rows[0];
};

export const createExpense = async ({ category, amount, date, note, billKey }) => {
  const id = uuidv7();

  await db.insert(expenses).values({ id, category, amount, date, note: note || null, billKey: billKey || null });

  return findExpenseById(id);
};

export const deleteExpense = async (id) => {
  await db.delete(expenses).where(eq(expenses.id, id));
};
