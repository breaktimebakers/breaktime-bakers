import { pgTable, varchar, numeric, index } from "drizzle-orm/pg-core";
import { batches } from "./batch.schema.js";
import { materialLots } from "./materialLot.schema.js";
import { rawMaterials } from "./rawMaterial.schema.js";

// The FIFO audit trail: exactly which lots a batch drew from, and at what
// cost. A single ingredient line on a batch can span multiple lots (the
// oldest one might not have had enough left), so this is a many-rows-per
// batch table, not one row per ingredient.
export const batchLotConsumptions = pgTable(
  "batch_lot_consumptions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    batchId: varchar("batch_id", { length: 36 })
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),

    lotId: varchar("lot_id", { length: 36 })
      .notNull()
      .references(() => materialLots.id, { onDelete: "restrict" }),

    // Denormalized - avoids a join through material_lots for
    // per-raw-material reporting.
    rawMaterialId: varchar("raw_material_id", { length: 36 })
      .notNull()
      .references(() => rawMaterials.id, { onDelete: "restrict" }),

    qtyConsumed: numeric("qty_consumed", { precision: 12, scale: 3, mode: "number" }).notNull(),

    // Snapshot of qtyConsumed * the lot's unit_cost at the moment of
    // consumption - never recalculated later, so editing a lot's rate
    // afterward can't rewrite a past batch's cost.
    costAtConsumption: numeric("cost_at_consumption", { precision: 12, scale: 2, mode: "number" }).notNull(),
  },
  (table) => ({
    batchIdIdx: index("batch_lot_consumptions_batch_id_idx").on(table.batchId),
    rawMaterialIdIdx: index("batch_lot_consumptions_raw_material_id_idx").on(table.rawMaterialId),
  }),
);
