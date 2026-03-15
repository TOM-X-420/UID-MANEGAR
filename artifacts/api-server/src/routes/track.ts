import { Router, type IRouter, type Request, type Response } from "express";
import { db, activityLogsTable } from "@workspace/db";
import { TrackRequestSchema } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/track", async (req: Request, res: Response) => {
  try {
    const body = TrackRequestSchema.parse(req.body);
    // Use real IP from headers or fallback
    const forwarded = req.headers["x-forwarded-for"];
    const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const ipAddress =
      forwardedStr?.split(",")[0]?.trim() ??
      req.socket.remoteAddress ??
      body.ip_address;

    await db.insert(activityLogsTable).values({
      ip_address: ipAddress,
      device_info: body.device_info,
      screen_size: body.screen_size,
      browser_info: body.browser_info,
      language: body.language,
      platform: body.platform,
      timezone: body.timezone,
      input_data: body.input_data ?? null,
      input_count: body.input_count ?? null,
      action_type: body.action_type,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Track error:", err);
    res.json({ success: false, message: "Tracking failed" });
  }
});

export default router;
