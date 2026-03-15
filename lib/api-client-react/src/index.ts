import { useQuery, useMutation } from '@tanstack/react-query';

const API_BASE = '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface TrackRequest {
  actionType: string;
  deviceInfo: string;
  ipAddress: string;
  screenSize?: string;
  browserInfo?: string;
  language?: string;
  platform?: string;
  timezone?: string;
  inputData?: string;
  inputCount?: number;
}

export interface ActivityLog {
  id: number;
  ipAddress: string;
  deviceInfo: string;
  screenSize?: string;
  browserInfo?: string;
  language?: string;
  platform?: string;
  timezone?: string;
  inputData?: string;
  inputCount?: number;
  actionType: string;
  createdAt: string;
}

export interface LogsResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  limit: number;
}

export interface StatsResponse {
  totalVisits: number;
  uniqueIPs: number;
  todayVisits: number;
  dataProcessed: number;
  topDevices: Array<{ name: string; count: number }>;
  topBrowsers: Array<{ name: string; count: number }>;
}

export interface UIDResult {
  uid: string;
  name?: string;
  friendCount?: number;
  lockStatus?: string;
  error?: string;
}

export interface LookupRequest {
  uids: string[];
  token: string;
  cookie?: string;
}

export interface DumpFriendsRequest {
  uid: string;
  token: string;
  cookie?: string;
}

export interface BulkDumpFriendsRequest {
  uids: string[];
  token: string;
  cookie?: string;
}

export interface DumpFriendsResponse {
  uid?: string;
  friends?: Array<{ id: string; name: string }>;
  total?: number;
  status?: string;
}

export function useHealthz() {
  return useQuery({
    queryKey: ['healthz'],
    queryFn: () => apiFetch<{ status: string }>('/healthz'),
  });
}

export function useAdminLogs(params: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['admin-logs', params],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params.page !== undefined) sp.set('page', String(params.page));
      if (params.limit !== undefined) sp.set('limit', String(params.limit));
      if (params.search) sp.set('search', params.search);
      return apiFetch<LogsResponse>(`/admin/logs?${sp.toString()}`);
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiFetch<StatsResponse>('/admin/stats'),
  });
}

export function useTrack() {
  return useMutation({
    mutationFn: (data: TrackRequest) =>
      apiFetch<{ success: boolean }>('/track', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useDeleteLog() {
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/admin/logs/${id}`, { method: 'DELETE' }),
  });
}

export function useFacebookLookup() {
  return useMutation({
    mutationFn: (data: LookupRequest) =>
      apiFetch<{ results: UIDResult[] }>('/facebook/lookup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useFacebookDumpFriends() {
  return useMutation({
    mutationFn: (data: DumpFriendsRequest) =>
      apiFetch<DumpFriendsResponse>('/facebook/dump-friends', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useFacebookBulkDumpFriends() {
  return useMutation({
    mutationFn: (data: BulkDumpFriendsRequest) =>
      apiFetch<{ results: DumpFriendsResponse[] }>('/facebook/bulk-dump-friends', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}
