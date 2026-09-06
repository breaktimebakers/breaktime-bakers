import { sendResponse } from "../../utils/apiResponse.js";
import * as salaryPaymentService from "./salaryPayment.service.js";

export const list = async (req, res) => {
  const payments = await salaryPaymentService.listPayments();

  sendResponse(res, 200, "Salary payments fetched", { payments });
};

export const payroll = async (req, res) => {
  const result = await salaryPaymentService.getPayroll(req.validatedQuery);

  sendResponse(res, 200, "Payroll fetched", result);
};

export const markPaid = async (req, res) => {
  const payment = await salaryPaymentService.markPaid(req.body);

  sendResponse(res, 200, "Salary marked as paid", { payment });
};

export const bulkMarkPaid = async (req, res) => {
  await salaryPaymentService.bulkMarkPaid(req.body);

  sendResponse(res, 200, "Salaries marked as paid", null);
};

export const markUnpaid = async (req, res) => {
  const { workerId, year, month } = req.params;

  await salaryPaymentService.markUnpaid(workerId, year, month);

  sendResponse(res, 200, "Salary marked as unpaid", null);
};
