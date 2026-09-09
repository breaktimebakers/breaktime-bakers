import { desc, eq, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { httpError } from "../../utils/httpError.js";
import { walkInSales } from "./walkInSale.schema.js";
import { products } from "../inventory/product.schema.js";
import { readyStockMovements } from "../inventory/readyStockMovement.schema.js";

const walkInSaleSelection = {
  id: walkInSales.id,
  productId: walkInSales.productId,
  productName: products.name,
  unit: products.unit,
  quantity: walkInSales.quantity,
  amount: walkInSales.amount,
  amountPaid: walkInSales.amountPaid,
  paymentStatus: walkInSales.paymentStatus,
  saleDate: walkInSales.saleDate,
  createdAt: walkInSales.createdAt,
  updatedAt: walkInSales.updatedAt,
};

const withProductJoin = (qb) => qb.from(walkInSales).innerJoin(products, eq(walkInSales.productId, products.id));

export const listWalkInSales = async () => {
  return withProductJoin(db.select(walkInSaleSelection)).orderBy(desc(walkInSales.saleDate), desc(walkInSales.createdAt));
};

export const findWalkInSaleById = async (id) => {
  const rows = await withProductJoin(db.select(walkInSaleSelection)).where(eq(walkInSales.id, id));

  return rows[0];
};

// Same oversell-prevention pattern as order fulfillment (order.repository.js):
// lock the product row so two concurrent counter sales can't both read the
// same available balance, then insert a negative ready_stock_movements row
// alongside the walk-in sale row in one transaction.
export const createWalkInSale = async ({ productId, quantity, amount, paymentStatus, amountPaid, saleDate }) => {
  const id = uuidv7();
  const resolvedAmountPaid = paymentStatus === "partial" ? amountPaid : amount;

  await db.transaction(async (tx) => {
    const [product] = await tx.select({ id: products.id }).from(products).where(eq(products.id, productId)).for("update");

    if (!product) {
      throw httpError(404, "Product not found");
    }

    const [{ available }] = await tx
      .select({ available: sql`COALESCE(SUM(${readyStockMovements.quantity}), 0)`.mapWith(Number) })
      .from(readyStockMovements)
      .where(eq(readyStockMovements.productId, productId));

    if (quantity > available) {
      throw httpError(409, `Not enough ready stock - short by ${quantity - available}`, "INSUFFICIENT_STOCK");
    }

    await tx.insert(readyStockMovements).values({
      id: uuidv7(),
      productId,
      quantity: -quantity,
      reason: "sale",
      occurredAt: new Date(),
    });

    await tx.insert(walkInSales).values({ id, productId, quantity, amount, paymentStatus, amountPaid: resolvedAmountPaid, saleDate });
  });

  return findWalkInSaleById(id);
};

export const markWalkInSalePaid = async (id) => {
  await db
    .update(walkInSales)
    .set({ paymentStatus: "paid", amountPaid: sql`${walkInSales.amount}`, updatedAt: new Date() })
    .where(eq(walkInSales.id, id));

  return findWalkInSaleById(id);
};

// Same row-lock-then-update pattern as createWalkInSale's stock check -
// locks the sale row so two concurrent payments against the same balance
// can't both read the same amountPaid and overpay it.
export const addWalkInSalePayment = async (id, amount) => {
  await db.transaction(async (tx) => {
    const [sale] = await tx
      .select({ amount: walkInSales.amount, amountPaid: walkInSales.amountPaid, paymentStatus: walkInSales.paymentStatus })
      .from(walkInSales)
      .where(eq(walkInSales.id, id))
      .for("update");

    if (!sale) {
      throw httpError(404, "Walk-in sale not found");
    }
    if (sale.paymentStatus === "paid") {
      throw httpError(409, "Walk-in sale is already fully paid", "ALREADY_PAID");
    }

    const remaining = Number(sale.amount) - Number(sale.amountPaid);
    if (amount > remaining) {
      throw httpError(422, `Payment exceeds remaining balance of ₹${remaining.toFixed(2)}`, "PAYMENT_EXCEEDS_BALANCE");
    }

    const newAmountPaid = Number(sale.amountPaid) + amount;
    const newStatus = newAmountPaid >= Number(sale.amount) ? "paid" : "partial";

    await tx
      .update(walkInSales)
      .set({ amountPaid: newAmountPaid, paymentStatus: newStatus, updatedAt: new Date() })
      .where(eq(walkInSales.id, id));
  });

  return findWalkInSaleById(id);
};
