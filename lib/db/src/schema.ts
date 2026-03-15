import { pgTable, serial, text, timestamp, varchar, integer } from 'drizzle-orm/pg-core';

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  uid: varchar('uid', { length: 64 }).notNull(),
  event: varchar('event', { length: 128 }).notNull(),
  ip: varchar('ip', { length: 64 }),
  userAgent: text('user_agent'),
  meta: text('meta'),
  count: integer('count').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
