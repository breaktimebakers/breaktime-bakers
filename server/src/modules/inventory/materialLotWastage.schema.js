import { pgTable, varchar, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { materialLots } from "./materialLot.schema.js";
import { rawMaterials } from "./rawMaterial.schema.js";
import { expenses } from "../finance/expense.schema.js";

// The audit trail for stock removed as spoilage/wastage (rats, expiry,
// etc.) - one row per lot a wastage event drew from. Mirrors
// batchLotConsumptions: costAtWastage is a snapshot (qty * the lot's
// unit_cost at the moment), never recalculated later. The human-facing
// date/note for the event live on the linked expense row itself, not
// duplicated here.
export const materialLotWastages = pgTable(
  "material_lot_wastages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    lotId: varchar("lot_id", { length: 36 })
      .notNull()
      .references(() => materialLots.id, { onDelete: "restrict" }),

    // Denormalized - avoids a join through material_lots for
    // per-raw-material reporting, same reasoning as batchLotConsumptions.
    rawMaterialId: varchar("raw_material_id", { length: 36 })
      .notNull()
      .references(() => rawMaterials.id, { onDelete: "restrict" }),

    // The expense IS the source of truth for this event - deleting it
    // (expenses are add + delete only) cascades this audit row away too.
    // Deleting the expense deliberately does NOT restore remainingQty on
    // the lot, same precedent as deleting a batch not un-consuming lots.
    expenseId: varchar("expense_id", { length: 36 })
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),

    qty: numeric("qty", { precision: 12, scale: 3, mode: "number" }).notNull(),

    costAtWastage: numeric("cost_at_wastage", { precision: 12, scale: 2, mode: "number" }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    rawMaterialIdIdx: index("material_lot_wastages_raw_material_id_idx").on(table.rawMaterialId),
  }),
);
