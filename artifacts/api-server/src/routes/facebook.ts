import { Router, type Router as RouterType } from 'express';
import { LookupRequestSchema, DumpFriendsRequestSchema, BulkDumpFriendsRequestSchema } from '@workspace/api-zod';

const router: RouterType = Router();

const USER_AGENTS = [
  'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 11; OnePlus 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)] as string;
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status === 400) return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

async function lookupUID(uid: string, token: string, cookie?: string) {
  const url = `https://graph.facebook.com/${uid}?fields=name,friends.limit(0).summary(true)&access_token=${token}`;
  const headers: Record<string, string> = {
    'User-Agent': randomUA(),
    'Accept': 'application/json',
  };
  if (cookie) headers['Cookie'] = cookie;

  try {
    const res = await fetchWithRetry(url, { headers });
    const data = await res.json() as Record<string, unknown>;
    if (data['error']) {
      const errMsg = (data['error'] as Record<string, unknown>)['message'] as string ?? 'Unknown error';
      return { uid, error: errMsg };
    }
    const friendsData = data['friends'] as Record<string, unknown> | undefined;
    const summary = friendsData?.['summary'] as Record<string, unknown> | undefined;
    return {
      uid,
      name: data['name'] as string | undefined,
      friendCount: summary?.['total_count'] as number | undefined,
      lockStatus: data['name'] ? 'unlocked' : 'private',
    };
  } catch (err) {
    return { uid, error: String(err) };
  }
}

router.post('/lookup', async (req, res) => {
  try {
    const { uids, token, cookie } = LookupRequestSchema.parse(req.body);
    const results = await Promise.all(uids.map(uid => lookupUID(uid, token, cookie)));
    res.json({ results });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

router.post('/dump-friends', async (req, res) => {
  try {
    const { uid, token, cookie } = DumpFriendsRequestSchema.parse(req.body);
    const url = `https://graph.facebook.com/${uid}/friends?limit=5000&access_token=${token}`;
    const headers: Record<string, string> = { 'User-Agent': randomUA() };
    if (cookie) headers['Cookie'] = cookie;

    const response = await fetchWithRetry(url, { headers });
    const data = await response.json() as Record<string, unknown>;
    const friendsArr = (data['data'] as Array<Record<string, string>>) ?? [];
    res.json({
      uid,
      friends: friendsArr.map(f => ({ id: f['id'] ?? '', name: f['name'] ?? '' })),
      total: friendsArr.length,
      status: 'ok',
    });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

router.post('/bulk-dump-friends', async (req, res) => {
  try {
    const { uids, token, cookie } = BulkDumpFriendsRequestSchema.parse(req.body);
    const results = await Promise.all(
      uids.map(async uid => {
        const url = `https://graph.facebook.com/${uid}/friends?limit=5000&access_token=${token}`;
        const headers: Record<string, string> = { 'User-Agent': randomUA() };
        if (cookie) headers['Cookie'] = cookie;
        try {
          const response = await fetchWithRetry(url, { headers });
          const data = await response.json() as Record<string, unknown>;
          const friendsArr = (data['data'] as Array<Record<string, string>>) ?? [];
          return {
            uid,
            friends: friendsArr.map(f => ({ id: f['id'] ?? '', name: f['name'] ?? '' })),
            total: friendsArr.length,
            status: 'ok',
          };
        } catch (err) {
          return { uid, friends: [], total: 0, status: String(err) };
        }
      })
    );
    res.json({ results });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

export default router;
