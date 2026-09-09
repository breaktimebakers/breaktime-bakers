import { sendResponse } from "../../utils/apiResponse.js";
import * as storeVisitNoteService from "./storeVisitNote.service.js";

export const list = async (req, res) => {
  const storeVisitNotes = await storeVisitNoteService.listStoreVisitNotes(req.validatedQuery);

  sendResponse(res, 200, "Store visit notes fetched", { storeVisitNotes });
};

export const create = async (req, res) => {
  const storeVisitNote = await storeVisitNoteService.createStoreVisitNote(req.body);

  sendResponse(res, 201, "Store marked closed", { storeVisitNote });
};
