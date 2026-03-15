import { desc, eq, count, countDistinct } from 'drizzle-orm';
import { getDb } from './client.js';
import { activityLogs } from './schema.js';
import type { NewActivityLog } from './schema.js';

export async function insertActivityLog(entry: Omit<NewActivityLog, 'id' | 'createdAt' | 'count'>) {
  const db = getDb();
  const [row] = await db.insert(activityLogs).values(entry).returning();
  return row;
}

export async function queryLogs(params: { page?: number; limit?: number; uid?: string }) {
  const db = getDb();
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 50));

  const baseQuery = params.uid
    ? db.select().from(activityLogs).where(eq(activityLogs.uid, params.uid))
    : db.select().from(activityLogs);

  const rows = await baseQuery
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return { data: rows, total: rows.length, page, limit };
}

export async function queryStats() {
  const db = getDb();
  const [stats] = await db
    .select({
      totalEvents: count(activityLogs.id),
      uniqueUids: countDistinct(activityLogs.uid),
    })
    .from(activityLogs);
  return stats ?? { totalEvents: 0, uniqueUids: 0 };
}
