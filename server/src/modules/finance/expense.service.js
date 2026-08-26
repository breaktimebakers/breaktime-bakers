import { httpError } from "../../utils/httpError.js";
import { createReadUrl } from "../../utils/objectStorage.js";
import * as expenseRepo from "./expense.repository.js";

const requireExpense = async (id) => {
  const expense = await expenseRepo.findExpenseById(id);

  if (!expense) {
    throw httpError(404, "Expense not found");
  }

  return expense;
};

// The bucket is private - a stored billKey is never handed to the client
// as-is, only swapped for a short-lived signed URL at read time.
const withSignedBillUrl = async (expense) => {
  if (!expense) return expense;

  const { billKey, ...rest } = expense;
  return { ...rest, billUrl: await createReadUrl(billKey) };
};

export const listExpenses = async () => {
  const list = await expenseRepo.listExpenses();
  return Promise.all(list.map(withSignedBillUrl));
};

export const createExpense = async (body) => withSignedBillUrl(await expenseRepo.createExpense(body));

export const deleteExpense = async (id) => {
  await requireExpense(id);

  await expenseRepo.deleteExpense(id);
};
