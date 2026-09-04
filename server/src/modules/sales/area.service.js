import { httpError } from "../../utils/httpError.js";
import * as areaRepo from "./area.repository.js";

const requireArea = async (id) => {
  const area = await areaRepo.findAreaById(id);

  if (!area || area.isArchived) {
    throw httpError(404, "Area not found");
  }

  return area;
};

const requireStore = async (id) => {
  const store = await areaRepo.findStoreById(id);

  if (!store) {
    throw httpError(404, "Store not found");
  }

  return store;
};

export const listAreas = () => areaRepo.listAreas();

export const getArea = (id) => requireArea(id);

export const createArea = (body) => areaRepo.createArea(body);

export const updateArea = async (id, body) => {
  await requireArea(id);

  return areaRepo.updateArea(id, body);
};

export const listStores = async (areaId) => {
  await requireArea(areaId);

  return areaRepo.listStoresForArea(areaId);
};

export const listAllStores = () => areaRepo.listAllStores();

export const listUnassignedStores = () => areaRepo.listUnassignedStores();

export const bulkAssignStores = async (storeIds, areaId) => {
  await requireArea(areaId);

  return areaRepo.bulkAssignStores(storeIds, areaId);
};

export const bulkUnassignStores = (storeIds) => areaRepo.bulkUnassignStores(storeIds);

export const createStore = async (areaId, body) => {
  await requireArea(areaId);

  return areaRepo.createStoreForArea(areaId, body);
};

export const updateStore = async (id, body) => {
  await requireStore(id);

  return areaRepo.updateStore(id, body);
};

export const updateStoreStatus = async (id, isActive) => {
  await requireStore(id);

  return areaRepo.updateStoreStatus(id, isActive);
};
