import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string().datetime(),
});

export const TrackRequestSchema = z.object({
  uid: z.string().max(64),
  event: z.string().max(128),
  meta: z.record(z.unknown()).optional(),
});

export const TrackResponseSchema = z.object({
  ok: z.boolean(),
});

export const LogEntrySchema = z.object({
  id: z.number().int(),
  uid: z.string(),
  event: z.string(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  meta: z.string().nullable(),
  count: z.number().int(),
  createdAt: z.string().datetime(),
});

export const LogsResponseSchema = z.object({
  data: z.array(LogEntrySchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export const StatsResponseSchema = z.object({
  totalEvents: z.number().int(),
  uniqueUids: z.number().int(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type TrackRequest = z.infer<typeof TrackRequestSchema>;
export type TrackResponse = z.infer<typeof TrackResponseSchema>;
export type LogEntry = z.infer<typeof LogEntrySchema>;
export type LogsResponse = z.infer<typeof LogsResponseSchema>;
export type StatsResponse = z.infer<typeof StatsResponseSchema>;
