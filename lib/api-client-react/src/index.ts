const API_BASE_URL = (typeof window !== "undefined" ? window.location.origin : "") + "";

async function fetchAPI<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function getHealth() {
  return fetchAPI<{ status: string }>("/api/healthz");
}

export async function trackActivity(data: {
  ip_address: string;
  device_info: string;
  screen_size: string;
  browser_info: string;
  language: string;
  platform: string;
  timezone: string;
  input_data?: string | null;
  input_count?: number | null;
  action_type: string;
}) {
  return fetchAPI<{ success: boolean }>("/api/track", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAdminLogs(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  const query = searchParams.toString();
  return fetchAPI<{
    logs: Array<{
      id: number;
      ip_address: string;
      device_info: string;
      screen_size: string;
      browser_info: string;
      language: string;
      platform: string;
      timezone: string;
      input_data: string | null;
      input_count: number | null;
      action_type: string;
      created_at: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }>(`/api/admin/logs${query ? `?${query}` : ""}`);
}

export async function getAdminStats() {
  return fetchAPI<{
    totalVisits: number;
    uniqueIPs: number;
    todayVisits: number;
    dataProcessedCount: number;
    topDevices: Array<{ name: string; count: number }>;
    topBrowsers: Array<{ name: string; count: number }>;
  }>("/api/admin/stats");
}

export async function deleteAdminLog(id: number) {
  return fetchAPI<{ success: boolean }>(`/api/admin/logs/${id}`, {
    method: "DELETE",
  });
}

export async function facebookLookup(data: {
  uids: string[];
  token: string;
  cookie?: string;
}) {
  return fetchAPI<{
    results: Array<{
      uid: string;
      name?: string | null;
      friendCount?: number | null;
      lockStatus: "unlocked" | "private" | "not_found" | "invalid_token" | "unknown";
      status: string;
    }>;
  }>("/api/facebook/lookup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function dumpFriends(data: {
  uid: string;
  token: string;
  cookie?: string;
  totalUsers?: number;
  maxPerFile?: number;
  perBatch?: number;
}) {
  return fetchAPI<{
    uid: string;
    friends: Array<{ id: string; name: string }>;
    status: string;
    totalFetched?: number;
  }>("/api/facebook/dump-friends", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function bulkDumpFriends(data: {
  uids: string[];
  token: string;
  cookie?: string;
  totalUsers?: number;
  maxPerFile?: number;
  perBatch?: number;
}) {
  return fetchAPI<{
    results: Array<{
      uid: string;
      friends: Array<{ id: string; name: string }>;
      status: string;
      totalFetched?: number;
    }>;
    totalSuccess: number;
    totalFailed: number;
  }>("/api/facebook/bulk-dump-friends", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
