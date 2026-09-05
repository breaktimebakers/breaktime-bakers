import { z } from "zod";

// Optional page keeps existing unpaginated consumers compatible. New tables
// opt in by sending page; pageSize is bounded before it reaches the repository.
export const paginationQueryShape = {
  page: z.coerce.number().int().min(1).max(2147483647).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
};

export const resolvePagination = (totalItems, { page = 1, pageSize = 10 } = {}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  return { page: safePage, pageSize, totalItems, totalPages };
};
