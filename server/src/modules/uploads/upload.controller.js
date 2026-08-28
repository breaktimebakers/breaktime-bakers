import { sendResponse } from "../../utils/apiResponse.js";
import * as uploadService from "./upload.service.js";

export const createUploadUrl = async (req, res) => {
  const result = await uploadService.createReceiptUploadUrl(req.body);

  sendResponse(res, 201, "Upload URL created", result);
};
