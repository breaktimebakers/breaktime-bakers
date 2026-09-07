import { todayIso } from "../../utils/dateRange.js";
import { resolvePagination } from "../../utils/pagination.js";
import * as statusRepo from "./status.repository.js";

export const listDeliveryStatus = async (query) => {
  const { filter, ...rest } = query;
  // "all" means genuinely unbounded - anything else defaults each side
  // independently to the business's current day when the client doesn't
  // supply an explicit range (still true for "today", which the client
  // implements by just sending from=to=today rather than a filter value).
  const from = filter === "all" ? undefined : query.from || todayIso();
  const to = filter === "all" ? undefined : query.to || todayIso();
  const filters = { ...rest, from, to };
  const pagination = resolvePagination(await statusRepo.countStatusRows(filters), query);
  const rows = await statusRepo.listStatusRows(filters, pagination);

  return { rows, pagination };
};
