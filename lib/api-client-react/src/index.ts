import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  HealthResponse,
  LogsResponse,
  StatsResponse,
  TrackRequest,
  TrackResponse,
} from '@workspace/api-zod';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function useHealthz() {
  return useQuery<HealthResponse>({
    queryKey: ['healthz'],
    queryFn: () => fetchJson<HealthResponse>(`${BASE_URL}/healthz`),
  });
}

export function useAdminLogs(params?: { page?: number; limit?: number; uid?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set('page', String(params.page));
  if (params?.limit != null) searchParams.set('limit', String(params.limit));
  if (params?.uid) searchParams.set('uid', params.uid);
  const query = searchParams.toString();
  return useQuery<LogsResponse>({
    queryKey: ['admin', 'logs', params],
    queryFn: () => fetchJson<LogsResponse>(`${BASE_URL}/admin/logs${query ? `?${query}` : ''}`),
  });
}

export function useAdminStats() {
  return useQuery<StatsResponse>({
    queryKey: ['admin', 'stats'],
    queryFn: () => fetchJson<StatsResponse>(`${BASE_URL}/admin/stats`),
  });
}

export function useTrack() {
  const queryClient = useQueryClient();
  return useMutation<TrackResponse, Error, TrackRequest>({
    mutationFn: (body: TrackRequest) =>
      fetchJson<TrackResponse>(`${BASE_URL}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}
