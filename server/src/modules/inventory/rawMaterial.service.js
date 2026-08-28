import { httpError } from "../../utils/httpError.js";
import { createReadUrl } from "../../utils/objectStorage.js";
import { resolveMonthRange } from "../../utils/dateRange.js";
import * as rawMaterialRepo from "./rawMaterial.repository.js";

const requireRawMaterial = async (id) => {
  const material = await rawMaterialRepo.findRawMaterialById(id);

  if (!material || material.isArchived) {
    throw httpError(404, "Raw material not found");
  }

  return material;
};

export const listRawMaterials = (query) => rawMaterialRepo.listRawMaterials(query);

export const getRawMaterial = (id) => requireRawMaterial(id);

export const createRawMaterial = (body) => rawMaterialRepo.createRawMaterialWithOpeningLot(body);

export const updateRawMaterial = async (id, body) => {
  await requireRawMaterial(id);

  return rawMaterialRepo.updateRawMaterial(id, body);
};

export const deleteRawMaterial = async (id) => {
  await requireRawMaterial(id);

  await rawMaterialRepo.archiveRawMaterial(id);
};

// The bucket is private - a stored receiptKey is never handed to the
// client as-is, only swapped for a short-lived signed URL at read time.
const withSignedReceiptUrl = async (lot) => {
  if (!lot) return lot;

  const { receiptKey, ...rest } = lot;
  return { ...rest, receiptUrl: await createReadUrl(receiptKey) };
};

export const listLots = async (rawMaterialId, query) => {
  await requireRawMaterial(rawMaterialId);

  const range = resolveMonthRange(query);
  const lots = await rawMaterialRepo.listLotsForMaterial(rawMaterialId, range);

  return Promise.all(lots.map(withSignedReceiptUrl));
};

export const createLot = async (rawMaterialId, body) => {
  await requireRawMaterial(rawMaterialId);

  const lot = await rawMaterialRepo.createLotForMaterial(rawMaterialId, body);
  return withSignedReceiptUrl(lot);
};
