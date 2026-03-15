import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const activityLogsTable = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  ipAddress: text('ip_address').notNull(),
  deviceInfo: text('device_info').notNull(),
  screenSize: text('screen_size'),
  browserInfo: text('browser_info'),
  language: text('language'),
  platform: text('platform'),
  timezone: text('timezone'),
  inputData: text('input_data'),
  inputCount: integer('input_count'),
  actionType: text('action_type').notNull().default('visit'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogsTable.$inferSelect;
export type NewActivityLog = typeof activityLogsTable.$inferInsert;
