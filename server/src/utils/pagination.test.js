import assert from "node:assert/strict";
import test from "node:test";
import { listOrdersQuerySchema } from "../modules/sales/order.validation.js";
import { resolvePagination } from "./pagination.js";

test("pagination preserves navigation on a partial last page", () => {
  assert.deepEqual(resolvePagination(15, { page: 2, pageSize: 10 }), {
    page: 2,
    pageSize: 10,
    totalItems: 15,
    totalPages: 2,
  });
});

test("pagination clamps pages after filtering or deleting results", () => {
  assert.equal(resolvePagination(5, { page: 3 }).page, 1);
  assert.deepEqual(resolvePagination(0, { page: 3 }), {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });
  assert.equal(resolvePagination(10).totalPages, 1);
  assert.equal(resolvePagination(11).totalPages, 2);
});

test("order queries opt into pagination without changing existing callers", () => {
  assert.equal(listOrdersQuerySchema.parse({}).page, undefined);
  const query = listOrdersQuerySchema.parse({ page: "2" });
  assert.equal(query.page, 2);
  assert.equal(query.pageSize, 10);
});

test("order queries reject invalid page limits and unrecognized sorting", () => {
  for (const query of [
    { page: "0" },
    { page: "-1" },
    { page: "1.5" },
    { page: "Infinity" },
    { pageSize: "0" },
    { pageSize: "101" },
    { sortKey: "unknown" },
    { sortDir: "unknown" },
  ]) {
    assert.equal(listOrdersQuerySchema.safeParse(query).success, false);
  }
});
