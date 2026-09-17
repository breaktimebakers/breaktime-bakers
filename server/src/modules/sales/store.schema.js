import { pgTable, varchar, numeric, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { areas } from "./area.schema.js";

export const stores = pgTable(
  "stores",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    // Nullable - a store with no area is "unassigned" (e.g. just removed
    // from an area being split, waiting to be moved into a new one). Not
    // "restrict" against being orphaned this way, only against the area
    // row itself being deleted while stores still point at it.
    areaId: varchar("area_id", { length: 36 }).references(() => areas.id, {
      onDelete: "restrict",
    }),

    dealerName: varchar("dealer_name", { length: 150 }).notNull(),

    // Required going forward (enforced in area.validation.js, not here -
    // kept nullable at the DB level so existing pre-this-change rows with
    // no shop name don't need a backfill migration).
    shopName: varchar("shop_name", { length: 150 }),

    dealerPhone: varchar("dealer_phone", { length: 20 }),

    // Defaults to dealerPhone client-side via a "same as phone" toggle,
    // but stored as its own value so it can diverge (e.g. dealer's WhatsApp
    // is a different number than their landline).
    whatsappNumber: varchar("whatsapp_number", { length: 20 }),

    // "Shop" / "Canteen" / "Other" from a closed picker in the UI -
    // validated as an enum at the API boundary (see area.validation.js),
    // but kept as free varchar here so a 4th type never needs a migration.
    storeType: varchar("store_type", { length: 20 }).notNull(),

    address: varchar("address", { length: 500 }),

    // ~11cm precision. Null until a location is actually picked.
    lat: numeric("lat", { precision: 9, scale: 6, mode: "number" }),
    lng: numeric("lng", { precision: 9, scale: 6, mode: "number" }),

    // Business status, not a soft-delete flag - whether this dealer is
    // currently taking product from us. Shown in the UI as a green/gray
    // status dot, toggled independently of editing the store's details.
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Every real query here is "this area's stores" - Area Detail's list,
    // and the store_count computed on the areas list.
    areaIdIdx: index("stores_area_id_idx").on(table.areaId),
  }),
);
