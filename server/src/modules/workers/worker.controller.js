import { sendResponse } from "../../utils/apiResponse.js";
import * as workerService from "./worker.service.js";

export const list = async (req, res) => {
  const workers = await workerService.listWorkers();

  sendResponse(res, 200, "Workers fetched", { workers });
};

export const getOne = async (req, res) => {
  const worker = await workerService.getWorker(req.params.id);

  sendResponse(res, 200, "Worker fetched", { worker });
};

export const create = async (req, res) => {
  const worker = await workerService.createWorker(req.body);

  sendResponse(res, 201, "Worker created", { worker });
};

export const update = async (req, res) => {
  const worker = await workerService.updateWorker(req.params.id, req.body);

  sendResponse(res, 200, "Worker updated", { worker });
};

export const markLeft = async (req, res) => {
  const worker = await workerService.markLeft(req.params.id);

  sendResponse(res, 200, "Worker marked as left", { worker });
};

export const reactivate = async (req, res) => {
  const worker = await workerService.reactivate(req.params.id);

  sendResponse(res, 200, "Worker reactivated", { worker });
};

export const remove = async (req, res) => {
  await workerService.deleteWorker(req.params.id);

  sendResponse(res, 200, "Worker deleted", null);
};
