import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/env.js";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/modules/**/*.schema.js",
  out: "./drizzle",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
