import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  ip_address: text("ip_address").notNull(),
  device_info: text("device_info").notNull(),
  screen_size: text("screen_size").notNull(),
  browser_info: text("browser_info").notNull(),
  language: text("language").notNull(),
  platform: text("platform").notNull(),
  timezone: text("timezone").notNull(),
  input_data: text("input_data"),
  input_count: integer("input_count"),
  action_type: text("action_type").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogsTable.$inferSelect;
export type NewActivityLog = typeof activityLogsTable.$inferInsert;
