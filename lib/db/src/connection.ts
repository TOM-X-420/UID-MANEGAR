import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { activityLogsTable } from "./schema";

const connectionString = process.env.DATABASE_URL ?? "postgres://localhost:5432/uid_manager";
const client = postgres(connectionString);

export const db = drizzle(client, { schema: { activityLogsTable } });
