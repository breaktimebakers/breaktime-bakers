import { sendResponse } from "../../utils/apiResponse.js";
import * as areaService from "./area.service.js";

export const list = async (req, res) => {
  const areas = await areaService.listAreas();

  sendResponse(res, 200, "Areas fetched", { areas });
};

export const getOne = async (req, res) => {
  const area = await areaService.getArea(req.params.id);

  sendResponse(res, 200, "Area fetched", { area });
};

export const create = async (req, res) => {
  const area = await areaService.createArea(req.body);

  sendResponse(res, 201, "Area created", { area });
};

export const update = async (req, res) => {
  const area = await areaService.updateArea(req.params.id, req.body);

  sendResponse(res, 200, "Area updated", { area });
};

export const listStores = async (req, res) => {
  const stores = await areaService.listStores(req.params.id);

  sendResponse(res, 200, "Stores fetched", { stores });
};

export const listAllStores = async (req, res) => {
  const stores = await areaService.listAllStores();

  sendResponse(res, 200, "Stores fetched", { stores });
};

export const createStore = async (req, res) => {
  const store = await areaService.createStore(req.params.id, req.body);

  sendResponse(res, 201, "Store created", { store });
};

export const updateStore = async (req, res) => {
  const store = await areaService.updateStore(req.params.id, req.body);

  sendResponse(res, 200, "Store updated", { store });
};

export const updateStoreStatus = async (req, res) => {
  const store = await areaService.updateStoreStatus(req.params.id, req.body.isActive);

  sendResponse(res, 200, "Store status updated", { store });
};
