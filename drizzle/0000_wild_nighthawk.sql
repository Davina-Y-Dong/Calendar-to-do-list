CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`source` text NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`content` text NOT NULL,
	`summary` text NOT NULL,
	`tasks` text NOT NULL,
	`status` text DEFAULT 'action' NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`due` text DEFAULT '' NOT NULL,
	`follow_date` text DEFAULT '' NOT NULL,
	`history` text DEFAULT '[]' NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_items_owner_updated` ON `items` (`owner`,`updated`);