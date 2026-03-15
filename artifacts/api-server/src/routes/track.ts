import { Router, type Router as RouterType } from 'express';
import { db } from '@workspace/db';
import { activityLogsTable } from '@workspace/db';
import { TrackRequestSchema } from '@workspace/api-zod';

const router: RouterType = Router();

router.post('/', async (req, res) => {
  try {
    const data = TrackRequestSchema.parse(req.body);
    await db.insert(activityLogsTable).values({
      ipAddress: data.ipAddress,
      deviceInfo: data.deviceInfo,
      screenSize: data.screenSize,
      browserInfo: data.browserInfo,
      language: data.language,
      platform: data.platform,
      timezone: data.timezone,
      inputData: data.inputData,
      inputCount: data.inputCount,
      actionType: data.actionType,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: String(err) });
  }
});

export default router;
