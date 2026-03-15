import express, { type Application } from 'express';
import { TrackRequestSchema } from '@workspace/api-zod';

const app: Application = express();
const PORT = Number(process.env['PORT'] ?? 3000);

app.use(express.json());

app.get('/api/healthz', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/track', async (req, res) => {
  const parsed = TrackRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { uid, event, meta } = parsed.data;

  try {
    const { insertActivityLog } = await import('@workspace/db');
    await insertActivityLog({
      uid,
      event,
      meta: meta != null ? JSON.stringify(meta) : null,
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  } catch {
    // DB unavailable – still return ok so callers are not blocked
  }

  res.json({ ok: true });
});

app.get('/api/admin/logs', async (req, res) => {
  const page = Number(req.query['page'] ?? 1);
  const limit = Number(req.query['limit'] ?? 50);
  const uid = typeof req.query['uid'] === 'string' ? req.query['uid'] : undefined;

  try {
    const { queryLogs } = await import('@workspace/db');
    const result = await queryLogs({ page, limit, uid });
    res.json(result);
  } catch {
    res.json({ data: [], total: 0, page: 1, limit: 50 });
  }
});

app.get('/api/admin/stats', async (_req, res) => {
  try {
    const { queryStats } = await import('@workspace/db');
    const stats = await queryStats();
    res.json(stats);
  } catch {
    res.json({ totalEvents: 0, uniqueUids: 0 });
  }
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

export default app;
