import { Router, type IRouter } from "express";

export const healthRouter: IRouter = Router();

healthRouter.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});
