import { pgTable, varchar, numeric, date, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { rawMaterials } from "./rawMaterial.schema.js";
import { vendors } from "./vendor.schema.js";

export const materialLots = pgTable(
  "material_lots",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    rawMaterialId: varchar("raw_material_id", { length: 36 })
      .notNull()
      .references(() => rawMaterials.id, { onDelete: "restrict" }),

    // A lot can be logged before the vendor is known/normalized.
    vendorId: varchar("vendor_id", { length: 36 }).references(() => vendors.id, {
      onDelete: "set null",
    }),

    // Immutable - what was actually bought. Kept separate from
    // remainingQty so purchase history survives being partly consumed.
    originalQty: numeric("original_qty", { precision: 12, scale: 3, mode: "number" }).notNull(),

    // Decremented as production consumes this lot, FIFO by purchaseDate.
    remainingQty: numeric("remaining_qty", { precision: 12, scale: 3, mode: "number" }).notNull(),

    unitCost: numeric("unit_cost", { precision: 12, scale: 2, mode: "number" }).notNull(),

    purchaseDate: date("purchase_date", { mode: "string" }).notNull(),

    // Whether the supplier has been paid for this lot - a lot IS the
    // purchase record, one row per purchase, so this lives directly here
    // rather than in a separate ledger table (unlike worker_salary_payments,
    // which is keyed by (workerId, year, month) - a period with no row of
    // its own anywhere else). Un-marking paid is a plain update back to
    // false here, not a delete.
    isPaid: boolean("is_paid").notNull().default(false),
    paidDate: date("paid_date", { mode: "string" }),

    // R2 object key, not a URL - the bucket is private, so viewing a
    // receipt always goes through a freshly-signed URL generated at
    // request time (see objectStorage.js), never a stored public link.
    receiptKey: varchar("receipt_key", { length: 500 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    rawMaterialPurchaseDateIdx: index("material_lots_raw_material_id_purchase_date_idx").on(
      table.rawMaterialId,
      table.purchaseDate,
    ),
  }),
);
