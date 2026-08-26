import { asc, eq, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { workers } from "./worker.schema.js";
import { workerRoles } from "./workerRole.schema.js";
import { workerAreas } from "./workerArea.schema.js";

// Roles live in a separate one-row-per-role table (see workerRole.schema.js)
// and are aggregated back into a plain string array here - same json_agg
// pattern as a batch's ingredientsUsed.
const rolesSql = sql`COALESCE((
  SELECT json_agg(wr.role ORDER BY wr.role)
  FROM worker_roles wr
  WHERE wr.worker_id = workers.id
), '[]'::json)`;

// A marketer's assigned sales territories - same join-table-aggregated-
// back-into-an-array pattern as roles above (see workerArea.schema.js).
const assignedAreaIdsSql = sql`COALESCE((
  SELECT json_agg(wa.area_id ORDER BY wa.area_id)
  FROM worker_areas wa
  WHERE wa.worker_id = workers.id
), '[]'::json)`;

const workerSelection = {
  id: workers.id,
  name: workers.name,
  address: workers.address,
  phone: workers.phone,
  aadhaarNumber: workers.aadhaarNumber,
  photoKey: workers.photoKey,
  joiningDate: workers.joiningDate,
  leftDate: workers.leftDate,
  status: workers.status,
  monthlySalary: workers.monthlySalary,
  overtimeRate: workers.overtimeRate,
  shiftStart: workers.shiftStart,
  shiftEnd: workers.shiftEnd,
  weekOffDay: workers.weekOffDay,
  createdAt: workers.createdAt,
  updatedAt: workers.updatedAt,
  roles: rolesSql,
  assignedAreaIds: assignedAreaIdsSql,
};

export const listWorkers = async () => {
  return db.select(workerSelection).from(workers).orderBy(asc(workers.name));
};

export const findWorkerById = async (id) => {
  const rows = await db.select(workerSelection).from(workers).where(eq(workers.id, id));

  return rows[0];
};

const replaceRoles = async (tx, workerId, roles) => {
  await tx.delete(workerRoles).where(eq(workerRoles.workerId, workerId));

  if (!roles.length) return;

  await tx.insert(workerRoles).values(roles.map((role) => ({ id: uuidv7(), workerId, role })));
};

export const createWorker = async ({ roles, ...body }) => {
  const id = await db.transaction(async (tx) => {
    const workerId = uuidv7();

    await tx.insert(workers).values({
      id: workerId,
      name: body.name,
      address: body.address || null,
      phone: body.phone || null,
      aadhaarNumber: body.aadhaarNumber || null,
      photoKey: body.photoKey || null,
      joiningDate: body.joiningDate,
      monthlySalary: body.monthlySalary,
      overtimeRate: body.overtimeRate,
      shiftStart: body.shiftStart,
      shiftEnd: body.shiftEnd,
      weekOffDay: body.weekOffDay,
    });

    await replaceRoles(tx, workerId, roles);

    return workerId;
  });

  return findWorkerById(id);
};

export const updateWorker = async (id, { roles, ...body }) => {
  const updates = {
    name: body.name,
    address: body.address || null,
    phone: body.phone || null,
    aadhaarNumber: body.aadhaarNumber || null,
    joiningDate: body.joiningDate,
    monthlySalary: body.monthlySalary,
    overtimeRate: body.overtimeRate,
    shiftStart: body.shiftStart,
    shiftEnd: body.shiftEnd,
    weekOffDay: body.weekOffDay,
    updatedAt: new Date(),
  };

  // Omitted entirely (not just falsy) means "photo unchanged" - a client
  // that isn't touching the photo this edit never sends the key at all.
  // Only an explicit new key or an explicit null (cleared) updates the
  // column. See EditWorkerModal for the client-side half of this.
  if (body.photoKey !== undefined) {
    updates.photoKey = body.photoKey || null;
  }

  const updatedId = await db.transaction(async (tx) => {
    const result = await tx
      .update(workers)
      .set(updates)
      .where(eq(workers.id, id))
      .returning({ id: workers.id });

    if (!result[0]) return undefined;

    await replaceRoles(tx, id, roles);

    return result[0].id;
  });

  if (!updatedId) return undefined;

  return findWorkerById(updatedId);
};

export const setWorkerLeaveStatus = async (id, { status, leftDate }) => {
  const result = await db
    .update(workers)
    .set({ status, leftDate, updatedAt: new Date() })
    .where(eq(workers.id, id))
    .returning({ id: workers.id });

  if (!result[0]) return undefined;

  return findWorkerById(id);
};

export const deleteWorker = async (id) => {
  await db.delete(workers).where(eq(workers.id, id));
};

// Full replace, not incremental add/remove - matches AssignAreasModal's
// "toggle a set, save" UX (same shape as replaceRoles above).
export const replaceWorkerAreas = async (workerId, areaIds) => {
  await db.transaction(async (tx) => {
    await tx.delete(workerAreas).where(eq(workerAreas.workerId, workerId));

    if (areaIds.length) {
      await tx.insert(workerAreas).values(areaIds.map((areaId) => ({ id: uuidv7(), workerId, areaId })));
    }
  });

  return findWorkerById(workerId);
};
