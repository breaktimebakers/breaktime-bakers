// Creates (or updates) an admin login. Idempotent: if the email already
// exists, its password is reset instead of failing.
//
// Usage:
//   node scripts/addAdmin.js --email=foo@bar.com --password='secret' [--name='Admin']
//
// Credentials are passed as flags/env vars rather than hardcoded here, so a
// real password never ends up committed to the repo.

import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { v7 as uuidv7 } from "uuid";
import { db } from "../src/db/index.js";
import { users } from "../src/modules/users/user.schema.js";
import { eq } from "drizzle-orm";

dotenv.config();

const parseArgs = () => {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
};

const args = parseArgs();

const email = args.email || process.env.ADMIN_EMAIL;
const password = args.password || process.env.ADMIN_PASSWORD;
const name = args.name || process.env.ADMIN_NAME || "Admin";

if (!email || !password) {
  console.error(
    "Usage: node scripts/addAdmin.js --email=foo@bar.com --password='secret' [--name='Admin']\n" +
      "(or set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME env vars)",
  );
  process.exit(1);
}

const run = async () => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const [existing] = await db.select().from(users).where(eq(users.email, email));

  if (existing) {
    await db
      .update(users)
      .set({ password: hashedPassword, name, updatedAt: new Date() })
      .where(eq(users.id, existing.id));
    console.log(`Updated existing admin "${email}" (password reset).`);
    return;
  }

  await db.insert(users).values({
    id: uuidv7(),
    name,
    email,
    password: hashedPassword,
    role: "admin",
  });

  console.log(`Created admin "${email}".`);
};

run()
  .catch((err) => {
    console.error("Failed to create/update admin:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
