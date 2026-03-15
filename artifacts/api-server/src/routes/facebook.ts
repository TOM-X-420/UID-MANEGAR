import { Router, type IRouter, type Request, type Response } from "express";
import {
  FacebookLookupRequestSchema,
  DumpFriendsRequestSchema,
  BulkDumpFriendsRequestSchema,
} from "@workspace/api-zod";

const router: IRouter = Router();

const FB_MOBILE_USER_AGENTS = [
  "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/406.0.0.30.108;]",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/20E247 [FBAN/FBIOS;FBAV/406.0.0.31.116;]",
  "Mozilla/5.0 (Linux; Android 11; Redmi Note 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/405.0.0.24.102;]",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/19G71 [FBAN/FBIOS;FBAV/405.0.0.28.112;]",
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/407.0.0.12.94;]",
];

function getRandomUserAgent() {
  return FB_MOBILE_USER_AGENTS[Math.floor(Math.random() * FB_MOBILE_USER_AGENTS.length)];
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<globalThis.Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      lastError = err as Error;
      if (i < retries - 1) await sleep(500 + Math.random() * 1000);
    }
  }
  throw lastError ?? new Error("Failed after retries");
}

async function lookupUID(
  uid: string,
  token: string,
  cookie?: string
): Promise<{
  uid: string;
  name: string | null;
  friendCount: number | null;
  lockStatus: "unlocked" | "private" | "not_found" | "invalid_token" | "unknown";
  status: string;
}> {
  const headers: Record<string, string> = {
    "User-Agent": getRandomUserAgent() ?? "",
    Authorization: `Bearer ${token}`,
  };
  if (cookie) headers["Cookie"] = cookie;

  try {
    const url = `https://graph.facebook.com/${uid}?fields=name,friends&access_token=${token}`;
    const res = await fetchWithRetry(url, { headers });
    const data = (await res.json()) as {
      name?: string;
      friends?: { summary?: { total_count?: number } };
      error?: { code?: number; message?: string };
    };

    if (data.error) {
      const code = data.error.code;
      if (code === 190 || code === 102) {
        return { uid, name: null, friendCount: null, lockStatus: "invalid_token", status: "invalid_token" };
      }
      if (code === 803 || code === 100) {
        return { uid, name: null, friendCount: null, lockStatus: "not_found", status: "not_found" };
      }
      return { uid, name: null, friendCount: null, lockStatus: "unknown", status: "error" };
    }

    if (!data.name) {
      return { uid, name: null, friendCount: null, lockStatus: "private", status: "private" };
    }

    const friendCount = data.friends?.summary?.total_count ?? null;
    return {
      uid,
      name: data.name,
      friendCount,
      lockStatus: "unlocked",
      status: "ok",
    };
  } catch {
    return { uid, name: null, friendCount: null, lockStatus: "unknown", status: "error" };
  }
}

router.post("/lookup", async (req: Request, res: Response) => {
  try {
    const body = FacebookLookupRequestSchema.parse(req.body);
    const results = await Promise.all(
      body.uids.map((uid) => lookupUID(uid, body.token, body.cookie))
    );
    res.json({ results });
  } catch (err) {
    console.error("Facebook lookup error:", err);
    res.status(400).json({ error: "Invalid request" });
  }
});

async function dumpFriendsForUID(
  uid: string,
  token: string,
  cookie?: string,
  _totalUsers?: number,
  _perBatch?: number
): Promise<{
  uid: string;
  friends: Array<{ id: string; name: string }>;
  status: string;
  totalFetched: number;
}> {
  const headers: Record<string, string> = {
    "User-Agent": getRandomUserAgent() ?? "",
  };
  if (cookie) headers["Cookie"] = cookie;

  const friends: Array<{ id: string; name: string }> = [];
  let cursor: string | null = null;
  let hasMore = true;

  try {
    while (hasMore) {
      const url = cursor
        ? `https://graph.facebook.com/${uid}/friends?fields=id,name&limit=50&after=${cursor}&access_token=${token}`
        : `https://graph.facebook.com/${uid}/friends?fields=id,name&limit=50&access_token=${token}`;

      const res = await fetchWithRetry(url, { headers });
      const data = (await res.json()) as {
        data?: Array<{ id: string; name: string }>;
        paging?: { cursors?: { after?: string }; next?: string };
        error?: { code?: number; message?: string };
      };

      if (data.error) {
        return { uid, friends, status: "error", totalFetched: friends.length };
      }

      if (data.data) {
        friends.push(...data.data);
      }

      if (data.paging?.next && data.paging.cursors?.after) {
        cursor = data.paging.cursors.after;
      } else {
        hasMore = false;
      }

      await sleep(200 + Math.random() * 300);
    }

    return { uid, friends, status: "ok", totalFetched: friends.length };
  } catch {
    return { uid, friends, status: "error", totalFetched: friends.length };
  }
}

router.post("/dump-friends", async (req: Request, res: Response) => {
  try {
    const body = DumpFriendsRequestSchema.parse(req.body);
    const result = await dumpFriendsForUID(
      body.uid,
      body.token,
      body.cookie,
      body.totalUsers,
      body.perBatch
    );
    res.json(result);
  } catch (err) {
    console.error("Dump friends error:", err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.post("/bulk-dump-friends", async (req: Request, res: Response) => {
  try {
    const body = BulkDumpFriendsRequestSchema.parse(req.body);
    const results = [];
    let totalSuccess = 0;
    let totalFailed = 0;

    for (const uid of body.uids) {
      const result = await dumpFriendsForUID(
        uid,
        body.token,
        body.cookie,
        body.totalUsers,
        body.perBatch
      );
      results.push(result);
      if (result.status === "ok") {
        totalSuccess++;
      } else {
        totalFailed++;
      }
    }

    res.json({ results, totalSuccess, totalFailed });
  } catch (err) {
    console.error("Bulk dump friends error:", err);
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
