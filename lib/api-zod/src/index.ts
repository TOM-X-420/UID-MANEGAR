import { z } from 'zod';

export const TrackRequestSchema = z.object({
  actionType: z.string(),
  deviceInfo: z.string(),
  ipAddress: z.string(),
  screenSize: z.string().optional(),
  browserInfo: z.string().optional(),
  language: z.string().optional(),
  platform: z.string().optional(),
  timezone: z.string().optional(),
  inputData: z.string().optional(),
  inputCount: z.number().int().optional(),
});

export const LookupRequestSchema = z.object({
  uids: z.array(z.string()),
  token: z.string(),
  cookie: z.string().optional(),
});

export const DumpFriendsRequestSchema = z.object({
  uid: z.string(),
  token: z.string(),
  cookie: z.string().optional(),
});

export const BulkDumpFriendsRequestSchema = z.object({
  uids: z.array(z.string()).max(500),
  token: z.string(),
  cookie: z.string().optional(),
});

export type TrackRequest = z.infer<typeof TrackRequestSchema>;
export type LookupRequest = z.infer<typeof LookupRequestSchema>;
export type DumpFriendsRequest = z.infer<typeof DumpFriendsRequestSchema>;
export type BulkDumpFriendsRequest = z.infer<typeof BulkDumpFriendsRequestSchema>;
