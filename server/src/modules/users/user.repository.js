import { eq } from "drizzle-orm";
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
