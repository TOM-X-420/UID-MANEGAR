import { Router, type IRouter } from "express";

export const adminRouter: IRouter = Router();

adminRouter.get("/logs", (_req, res) => {
  res.json({ logs: [], total: 0 });
});

adminRouter.get("/stats", (_req, res) => {
  res.json({
    totalVisits: 0,
    uniqueIps: 0,
    todayVisits: 0,
    dataProcessed: 0,
  });
});

adminRouter.delete("/logs/:id", (req, res) => {
  const { id } = req.params;
  void id;
  res.json({ ok: true });
});
