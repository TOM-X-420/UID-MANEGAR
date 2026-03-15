import { Router, type IRouter, type Request, type Response } from "express";
import { db, activityLogsTable } from "@workspace/db";
import { eq, ilike, or, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/logs", async (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query["page"] ?? "1"), 10);
    const limit = parseInt(String(req.query["limit"] ?? "20"), 10);
    const search = String(req.query["search"] ?? "");
    const offset = (page - 1) * limit;

    const whereClause = search
      ? or(
          ilike(activityLogsTable.ip_address, `%${search}%`),
          ilike(activityLogsTable.device_info, `%${search}%`),
          ilike(activityLogsTable.browser_info, `%${search}%`),
          ilike(activityLogsTable.action_type, `%${search}%`)
        )
      : undefined;

    const [logs, countResult] = await Promise.all([
      db
        .select()
        .from(activityLogsTable)
        .where(whereClause)
        .orderBy(desc(activityLogsTable.created_at))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(activityLogsTable)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    res.json({
      logs: logs.map((l) => ({
        ...l,
        created_at: l.created_at.toISOString(),
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("Admin logs error:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalVisitsResult,
      uniqueIPsResult,
      todayVisitsResult,
      dataProcessedResult,
      devicesResult,
      browsersResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(activityLogsTable),
      db
        .select({ count: sql<number>`count(distinct ip_address)::int` })
        .from(activityLogsTable),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(activityLogsTable)
        .where(sql`created_at >= ${today.toISOString()}`),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(activityLogsTable)
        .where(eq(activityLogsTable.action_type, "process")),
      db
        .select({
          name: activityLogsTable.platform,
          count: sql<number>`count(*)::int`,
        })
        .from(activityLogsTable)
        .groupBy(activityLogsTable.platform)
        .orderBy(sql`count(*) desc`)
        .limit(5),
      db
        .select({
          name: activityLogsTable.browser_info,
          count: sql<number>`count(*)::int`,
        })
        .from(activityLogsTable)
        .groupBy(activityLogsTable.browser_info)
        .orderBy(sql`count(*) desc`)
        .limit(5),
    ]);

    res.json({
      totalVisits: totalVisitsResult[0]?.count ?? 0,
      uniqueIPs: uniqueIPsResult[0]?.count ?? 0,
      todayVisits: todayVisitsResult[0]?.count ?? 0,
      dataProcessedCount: dataProcessedResult[0]?.count ?? 0,
      topDevices: devicesResult.map((d) => ({ name: d.name, count: d.count })),
      topBrowsers: browsersResult.map((b) => ({
        name: b.name,
        count: b.count,
      })),
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.delete("/logs/:id", async (req: Request, res: Response) => {
  try {
    const rawId = req.params["id"];
    const id = parseInt(Array.isArray(rawId) ? (rawId[0] ?? "0") : (rawId ?? "0"), 10);
    await db
      .delete(activityLogsTable)
      .where(eq(activityLogsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error("Delete log error:", err);
    res.status(500).json({ error: "Failed to delete log" });
  }
});

export default router;
