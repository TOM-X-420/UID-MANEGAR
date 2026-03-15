import { Router, Request, Response, type IRouter } from "express";

export const trackRouter: IRouter = Router();

trackRouter.post("/track", (req: Request, res: Response) => {
  // Silent tracking endpoint — logs are stored via DB in production
  const { actionType, inputData, inputCount } = req.body as {
    actionType?: string;
    inputData?: string;
    inputCount?: number;
  };
  if (!actionType) {
    res.status(400).json({ error: "actionType required" });
    return;
  }
  // In production: persist to DB
  void inputData;
  void inputCount;
  res.json({ ok: true });
});
