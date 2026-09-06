import { todayIso } from "../../utils/dateRange.js";
import { resolvePagination } from "../../utils/pagination.js";
import * as statusRepo from "./status.repository.js";

export const listDeliveryStatus = async (query) => {
  // The status board defaults to the business's current day when no range is supplied.
  const from = query.from || todayIso();
  const to = query.to || todayIso();
  const filters = { ...query, from, to };
  const pagination = resolvePagination(await statusRepo.countStatusRows(filters), query);
  const rows = await statusRepo.listStatusRows(filters, pagination);

  return { rows, pagination };
};
