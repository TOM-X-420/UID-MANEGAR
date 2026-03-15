import { z } from "zod";

export const TrackRequestSchema = z.object({
  actionType: z.string(),
  inputData: z.string().optional(),
  inputCount: z.number().int().optional(),
});

export const FacebookLookupRequestSchema = z.object({
  uids: z.array(z.string()),
  token: z.string(),
  cookie: z.string().optional(),
});

export type TrackRequest = z.infer<typeof TrackRequestSchema>;
export type FacebookLookupRequest = z.infer<typeof FacebookLookupRequestSchema>;
