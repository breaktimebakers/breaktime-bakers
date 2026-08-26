import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { isUniqueViolation } from "../../utils/dbErrors.js";
import { products } from "./product.schema.js";

// Finds-or-creates a product by name inside the caller's transaction, same
// race-safe pattern as upsertVendorByName in rawMaterial.repository.js.
// Refreshes pricePerUnit only when one is actually supplied, so a batch
// logged without a price can't blank out whatever price was set before.
export const upsertProductByName = async (tx, { name, unit, pricePerUnit }) => {
  const existing = await tx.select({ id: products.id }).from(products).where(eq(products.name, name));

  if (existing[0]) {
    if (pricePerUnit !== undefined && pricePerUnit !== null) {
      await tx
        .update(products)
        .set({ pricePerUnit, updatedAt: new Date() })
        .where(eq(products.id, existing[0].id));
    }
    return existing[0].id;
  }

  try {
    const id = uuidv7();
    await tx.insert(products).values({ id, name, unit, pricePerUnit: pricePerUnit ?? null });
    return id;
  } catch (err) {
    // Lost a race with another admin creating the same product - use theirs.
    if (isUniqueViolation(err)) {
      const retry = await tx.select({ id: products.id }).from(products).where(eq(products.name, name));
      if (retry[0]) return retry[0].id;
    }
    throw err;
  }
};
