import { sendResponse } from "../../utils/apiResponse.js";
import * as taxEntryService from "./taxEntry.service.js";

export const list = async (req, res) => {
  const taxEntries = await taxEntryService.listTaxEntries();

  sendResponse(res, 200, "Tax entries fetched", { taxEntries });
};

export const create = async (req, res) => {
  const taxEntry = await taxEntryService.createTaxEntry(req.body);

  sendResponse(res, 201, "Tax entry added", { taxEntry });
};

export const remove = async (req, res) => {
  await taxEntryService.deleteTaxEntry(req.params.id);

  sendResponse(res, 200, "Tax entry deleted", null);
};
