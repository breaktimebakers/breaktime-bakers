import bcrypt from "bcrypt";
import { v7 as uuidv7 } from "uuid";
import { db } from "../db/index.js";
import { users } from "../modules/users/user.schema.js";
import { findUserByEmail } from "../modules/users/user.repository.js";

const admins = [
  {
    name: "Admin",
    email: "admin@admin.com",
    password: "admin",
  },
];

const run = async () => {
  for (const admin of admins) {
    const existing = await findUserByEmail(admin.email);

    if (existing) {
      console.log(`Skipping ${admin.email}, already exists`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(admin.password, 10);

    await db.insert(users).values({
      id: uuidv7(),
      name: admin.name,
      email: admin.email,
      password: hashedPassword,
      role: "admin",
    });

    console.log(`Created ${admin.email}`);
  }

  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed", err);
  process.exit(1);
});
