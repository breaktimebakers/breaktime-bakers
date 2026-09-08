import { httpError } from "../../utils/httpError.js";
import * as walkInSaleRepo from "./walkInSale.repository.js";

const requireWalkInSale = async (id) => {
  const sale = await walkInSaleRepo.findWalkInSaleById(id);

  if (!sale) {
    throw httpError(404, "Walk-in sale not found");
  }

  return sale;
};

export const listWalkInSales = () => walkInSaleRepo.listWalkInSales();

export const createWalkInSale = (body) => walkInSaleRepo.createWalkInSale(body);

export const settleWalkInSale = async (id) => {
  const sale = await requireWalkInSale(id);

  if (sale.paymentStatus === "paid") {
    return sale;
  }

  return walkInSaleRepo.markWalkInSalePaid(id);
};
