import { sendResponse } from "../../utils/apiResponse.js";
import * as expenseService from "./expense.service.js";

export const list = async (req, res) => {
  const expenses = await expenseService.listExpenses();

  sendResponse(res, 200, "Expenses fetched", { expenses });
};

export const create = async (req, res) => {
  const expense = await expenseService.createExpense(req.body);

  sendResponse(res, 201, "Expense added", { expense });
};

export const remove = async (req, res) => {
  await expenseService.deleteExpense(req.params.id);

  sendResponse(res, 200, "Expense deleted", null);
};
