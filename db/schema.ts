import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const items = sqliteTable('items', {
 id: text('id').primaryKey(), owner: text('owner').notNull(),
 title: text('title').notNull(), source: text('source').notNull(), url: text('url').notNull().default(''),
 content: text('content').notNull(), summary: text('summary').notNull(),
 tasks: text('tasks').notNull(), status: text('status').notNull().default('action'),
 contact: text('contact').notNull().default(''), due: text('due').notNull().default(''),
 followDate: text('follow_date').notNull().default(''), history: text('history').notNull().default('[]'),
 created: text('created').notNull(), updated: text('updated').notNull(),
}, t => [index('idx_items_owner_updated').on(t.owner, t.updated)]);
