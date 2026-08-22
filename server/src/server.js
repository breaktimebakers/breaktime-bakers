import { sql } from "drizzle-orm";
import app from "./app.js";
import { env } from "./config/env.js";
import { db } from "./db/index.js";

const startServer = async () => {
  try {
    await db.execute(sql`SELECT 1`);
    console.log("Database Connected");

    app.listen(env.PORT, () => {
      console.log(`Server is running on ${env.PORT}`);
    });
  } catch (err) {
    console.error("Database Connection Failed", err);
    process.exit(1);
  }
};

startServer();
