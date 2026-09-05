import { todayIso } from "../../utils/dateRange.js";
import * as salesRepo from "./sales.repository.js";

export const getOverview = () => salesRepo.getOverview(todayIso());
