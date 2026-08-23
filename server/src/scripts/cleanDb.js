import { and, isNotNull, lt, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions } from "../modules/sessions/session.schema.js";

const DEFAULT_RETENTION_DAYS = 30;

const parseRetentionDays = () => {
  const daysArg = process.argv.find((arg) => arg.startsWith("--days="));
  const rawDays = daysArg?.split("=")[1] ?? process.env.CLEAN_SESSIONS_RETENTION_DAYS;

  if (!rawDays) {
    return DEFAULT_RETENTION_DAYS;
  }

  const days = Number(rawDays);

  if (!Number.isInteger(days) || days < 0) {
    throw new Error("Retention days must be a positive integer");
  }

  return days;
};

const cleanSessions = async () => {
  const retentionDays = parseRetentionDays();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const deletedSessions = await db
    .delete(sessions)
    .where(
      or(
        lt(sessions.expiresAt, cutoff),
        and(isNotNull(sessions.revokedAt), lt(sessions.revokedAt, cutoff)),
      ),
    )
    .returning({ id: sessions.id });

  console.log(
    `Deleted ${deletedSessions.length} expired/revoked session(s) older than ${retentionDays} day(s).`,
  );
};

const tasks = {
  sessions: cleanSessions,
};

const run = async () => {
  const taskName = process.argv[2];

  if (!taskName || !tasks[taskName]) {
    const availableTasks = Object.keys(tasks).join(", ");
    throw new Error(`Usage: npm run db:clean -- <task>. Available tasks: ${availableTasks}`);
  }

  await tasks[taskName]();
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Database cleanup failed", err);
    process.exit(1);
  });
