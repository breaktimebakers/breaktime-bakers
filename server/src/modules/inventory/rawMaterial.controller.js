import { sendResponse } from "../../utils/apiResponse.js";
import * as rawMaterialService from "./rawMaterial.service.js";

export const list = async (req, res) => {
  const result = await rawMaterialService.listRawMaterials(req.validatedQuery);

  sendResponse(res, 200, "Raw materials fetched", result);
};

export const getOne = async (req, res) => {
  const rawMaterial = await rawMaterialService.getRawMaterial(req.params.id);

  sendResponse(res, 200, "Raw material fetched", { rawMaterial });
};

export const create = async (req, res) => {
  const rawMaterial = await rawMaterialService.createRawMaterial(req.body);

  sendResponse(res, 201, "Raw material created", { rawMaterial });
};

export const update = async (req, res) => {
  const rawMaterial = await rawMaterialService.updateRawMaterial(req.params.id, req.body);

  sendResponse(res, 200, "Raw material updated", { rawMaterial });
};

export const remove = async (req, res) => {
  await rawMaterialService.deleteRawMaterial(req.params.id);

  sendResponse(res, 200, "Raw material deleted", null);
};

export const listLots = async (req, res) => {
  const lots = await rawMaterialService.listLots(req.params.id, req.validatedQuery);

  sendResponse(res, 200, "Lots fetched", { lots });
};

export const createLot = async (req, res) => {
  const lot = await rawMaterialService.createLot(req.params.id, req.body);

  sendResponse(res, 201, "Lot added", { lot });
};

export const createWastage = async (req, res) => {
  const rawMaterial = await rawMaterialService.createWastage(req.params.id, req.params.lotId, req.body);

  sendResponse(res, 201, "Marked as wastage", { rawMaterial });
};

export const listAllLots = async (req, res) => {
  const lots = await rawMaterialService.listAllLots(req.validatedQuery);

  sendResponse(res, 200, "Lots fetched", { lots });
};

export const updateLotPayment = async (req, res) => {
  const lot = await rawMaterialService.updateLotPayment(req.params.lotId, req.body);

  sendResponse(res, 200, "Payment status updated", { lot });
};
