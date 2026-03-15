import { z } from "zod";

export const HealthResponseSchema = z.object({
  status: z.string(),
});

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const TrackRequestSchema = z.object({
  ip_address: z.string(),
  device_info: z.string(),
  screen_size: z.string(),
  browser_info: z.string(),
  language: z.string(),
  platform: z.string(),
  timezone: z.string(),
  input_data: z.string().nullable().optional(),
  input_count: z.number().int().nullable().optional(),
  action_type: z.string(),
});

export const ActivityLogEntrySchema = z.object({
  id: z.number().int(),
  ip_address: z.string(),
  device_info: z.string(),
  screen_size: z.string(),
  browser_info: z.string(),
  language: z.string(),
  platform: z.string(),
  timezone: z.string(),
  input_data: z.string().nullable().optional(),
  input_count: z.number().int().nullable().optional(),
  action_type: z.string(),
  created_at: z.string(),
});

export const LogsResponseSchema = z.object({
  logs: z.array(ActivityLogEntrySchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export const TopItemSchema = z.object({
  name: z.string(),
  count: z.number().int(),
});

export const StatsResponseSchema = z.object({
  totalVisits: z.number().int(),
  uniqueIPs: z.number().int(),
  todayVisits: z.number().int(),
  dataProcessedCount: z.number().int(),
  topDevices: z.array(TopItemSchema),
  topBrowsers: z.array(TopItemSchema),
});

export const FacebookLookupRequestSchema = z.object({
  uids: z.array(z.string()),
  token: z.string(),
  cookie: z.string().optional(),
});

export const LockStatusSchema = z.enum([
  "unlocked",
  "private",
  "not_found",
  "invalid_token",
  "unknown",
]);

export const FacebookLookupResultSchema = z.object({
  uid: z.string(),
  name: z.string().nullable().optional(),
  friendCount: z.number().int().nullable().optional(),
  lockStatus: LockStatusSchema,
  status: z.string(),
});

export const FacebookLookupResponseSchema = z.object({
  results: z.array(FacebookLookupResultSchema),
});

export const DumpFriendsRequestSchema = z.object({
  uid: z.string(),
  token: z.string(),
  cookie: z.string().optional(),
  totalUsers: z.number().int().optional(),
  maxPerFile: z.number().int().optional(),
  perBatch: z.number().int().optional(),
});

export const FriendEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const DumpFriendsResponseSchema = z.object({
  uid: z.string(),
  friends: z.array(FriendEntrySchema),
  status: z.string(),
  totalFetched: z.number().int().optional(),
});

export const BulkDumpFriendsRequestSchema = z.object({
  uids: z.array(z.string()).max(500),
  token: z.string(),
  cookie: z.string().optional(),
  totalUsers: z.number().int().optional(),
  maxPerFile: z.number().int().optional(),
  perBatch: z.number().int().optional(),
});

export const BulkDumpFriendsResponseSchema = z.object({
  results: z.array(DumpFriendsResponseSchema),
  totalSuccess: z.number().int(),
  totalFailed: z.number().int(),
});

export type TrackRequest = z.infer<typeof TrackRequestSchema>;
export type ActivityLogEntry = z.infer<typeof ActivityLogEntrySchema>;
export type LogsResponse = z.infer<typeof LogsResponseSchema>;
export type StatsResponse = z.infer<typeof StatsResponseSchema>;
export type FacebookLookupRequest = z.infer<typeof FacebookLookupRequestSchema>;
export type FacebookLookupResult = z.infer<typeof FacebookLookupResultSchema>;
export type FacebookLookupResponse = z.infer<typeof FacebookLookupResponseSchema>;
export type DumpFriendsRequest = z.infer<typeof DumpFriendsRequestSchema>;
export type FriendEntry = z.infer<typeof FriendEntrySchema>;
export type DumpFriendsResponse = z.infer<typeof DumpFriendsResponseSchema>;
export type BulkDumpFriendsRequest = z.infer<typeof BulkDumpFriendsRequestSchema>;
export type BulkDumpFriendsResponse = z.infer<typeof BulkDumpFriendsResponseSchema>;
export type LockStatus = z.infer<typeof LockStatusSchema>;
