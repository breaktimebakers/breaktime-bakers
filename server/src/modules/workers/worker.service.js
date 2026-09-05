import { httpError } from "../../utils/httpError.js";
import { createReadUrl } from "../../utils/objectStorage.js";
import * as workerRepo from "./worker.repository.js";

const requireWorker = async (id) => {
  const worker = await workerRepo.findWorkerById(id);

  if (!worker) {
    throw httpError(404, "Worker not found");
  }

  return worker;
};

// The bucket is private - a stored photoKey is never handed to the client
// as-is, only swapped for a short-lived signed URL at read time.
const withSignedPhotoUrl = async (worker) => {
  if (!worker) return worker;

  const { photoKey, ...rest } = worker;
  return { ...rest, photoUrl: await createReadUrl(photoKey) };
};

export const listWorkers = async () => {
  const list = await workerRepo.listWorkers();
  return Promise.all(list.map(withSignedPhotoUrl));
};

export const getWorker = async (id) => withSignedPhotoUrl(await requireWorker(id));

export const createWorker = async (body) => withSignedPhotoUrl(await workerRepo.createWorker(body));

export const updateWorker = async (id, body) => {
  await requireWorker(id);

  return withSignedPhotoUrl(await workerRepo.updateWorker(id, body));
};

export const markLeft = async (id) => {
  await requireWorker(id);

  const leftDate = new Date().toISOString().slice(0, 10);
  return withSignedPhotoUrl(await workerRepo.setWorkerLeaveStatus(id, { status: "left", leftDate }));
};

export const reactivate = async (id) => {
  await requireWorker(id);

  return withSignedPhotoUrl(await workerRepo.setWorkerLeaveStatus(id, { status: "active", leftDate: null }));
};

export const deleteWorker = async (id) => {
  await requireWorker(id);

  await workerRepo.deleteWorker(id);
};
