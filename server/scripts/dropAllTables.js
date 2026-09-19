// Drops every table in the database's public schema. Irreversible.
//
// Usage:
//   node scripts/dropAllTables.js --yes
//
// The --yes flag is required so this can't be triggered by an accidental
// `node scripts/dropAllTables.js`. Reads DATABASE_URL directly (not
// src/config/env.js) so it doesn't also require unrelated vars (R2 creds
// etc.) just to run a DB maintenance script.

import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const confirmed = process.argv.includes("--yes");

if (!confirmed) {
  console.error(
    "Refusing to run: this drops every table in the database.\n" +
      "Re-run with --yes if you're sure:\n" +
      "  node scripts/dropAllTables.js --yes",
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in environment/.env");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const run = async () => {
  const { rows } = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = current_schema()",
  );

  if (rows.length === 0) {
    console.log("No tables found - nothing to drop.");
    return;
  }

  console.log(`Dropping ${rows.length} table(s):`);
  rows.forEach((r) => console.log(`  - ${r.tablename}`));

  await pool.query(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema())
      LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);

  console.log("Done. All tables dropped.");
};

run()
  .catch((err) => {
    console.error("Failed to drop tables:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
