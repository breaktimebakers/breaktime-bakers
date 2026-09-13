import { asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "./user.schema.js";

export const findUserByEmail = async (email) => {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0];
};

export const findUserById = async (id) => {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
};

export const createUser = async (data) => {
  const result = await db.insert(users).values(data).returning();
  return result[0];
};

// Password never selected - this only ever backs an admin-management list.
export const listAdminUsers = async () => {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "admin"))
    .orderBy(asc(users.createdAt));
};

export const deleteUserById = async (id) => {
  const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  return result[0];
};

export const updateUserPassword = async (id, hashedPassword) => {
  const result = await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id });
  return result[0];
};
