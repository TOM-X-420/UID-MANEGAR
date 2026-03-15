import { Router, type Router as RouterType } from 'express';
import { db } from '@workspace/db';
import { activityLogsTable } from '@workspace/db';
import { eq, desc, sql, like, or, SQL } from 'drizzle-orm';

const router: RouterType = Router();

router.get('/logs', async (req, res) => {
  try {
    const page = Number(req.query['page'] ?? 1);
    const limit = Number(req.query['limit'] ?? 20);
    const search = req.query['search'] as string | undefined;
    const offset = (page - 1) * limit;

    let whereClause: SQL | undefined;
    if (search) {
      const pattern = `%${search}%`;
      whereClause = or(
        like(activityLogsTable.ipAddress, pattern),
        like(activityLogsTable.deviceInfo, pattern),
        like(activityLogsTable.actionType, pattern)
      );
    }

    const [logs, countResult] = await Promise.all([
      db.select().from(activityLogsTable)
        .where(whereClause)
        .orderBy(desc(activityLogsTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(activityLogsTable).where(whereClause),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    res.json({ logs, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalResult, uniqueIPResult, todayResult, deviceResult, browserResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(activityLogsTable),
      db.select({ count: sql<number>`count(distinct ${activityLogsTable.ipAddress})` }).from(activityLogsTable),
      db.select({ count: sql<number>`count(*)` }).from(activityLogsTable).where(sql`${activityLogsTable.createdAt} >= ${today}`),
      db.select({
        name: activityLogsTable.deviceInfo,
        count: sql<number>`count(*)`,
      }).from(activityLogsTable).groupBy(activityLogsTable.deviceInfo).orderBy(desc(sql`count(*)`)).limit(5),
      db.select({
        name: activityLogsTable.browserInfo,
        count: sql<number>`count(*)`,
      }).from(activityLogsTable).groupBy(activityLogsTable.browserInfo).orderBy(desc(sql`count(*)`)).limit(5),
    ]);

    res.json({
      totalVisits: Number(totalResult[0]?.count ?? 0),
      uniqueIPs: Number(uniqueIPResult[0]?.count ?? 0),
      todayVisits: Number(todayResult[0]?.count ?? 0),
      dataProcessed: Number(totalResult[0]?.count ?? 0),
      topDevices: deviceResult.map(d => ({ name: d.name ?? 'Unknown', count: Number(d.count) })),
      topBrowsers: browserResult.map(b => ({ name: b.name ?? 'Unknown', count: Number(b.count) })),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/logs/:id', async (req, res) => {
  try {
    const id = Number(req.params['id']);
    await db.delete(activityLogsTable).where(eq(activityLogsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
