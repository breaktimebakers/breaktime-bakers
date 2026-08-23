import { httpError } from "../../utils/httpError.js";
import { createReadUrl } from "../../utils/objectStorage.js";
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

const pad = (n) => String(n).padStart(2, "0");

const currentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const from = `${year}-${pad(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${pad(month + 1)}-${pad(lastDay)}`;

  return { from, to };
};

// Only defaults when BOTH bounds are omitted - an admin who passes just
// `from` or just `to` gets an open-ended range on the other side, not a
// silently-clamped month.
const resolveLotDateRange = ({ from, to } = {}) => {
  if (!from && !to) return currentMonthRange();
  return { from, to };
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

  const range = resolveLotDateRange(query);
  const lots = await rawMaterialRepo.listLotsForMaterial(rawMaterialId, range);

  return Promise.all(lots.map(withSignedReceiptUrl));
};

export const createLot = async (rawMaterialId, body) => {
  await requireRawMaterial(rawMaterialId);

  const lot = await rawMaterialRepo.createLotForMaterial(rawMaterialId, body);
  return withSignedReceiptUrl(lot);
};
