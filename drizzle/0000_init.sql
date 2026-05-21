CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `issue_categories` (
	`issue_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	PRIMARY KEY(`issue_id`, `category_id`),
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_issue_categories_category` ON `issue_categories` (`category_id`);--> statement-breakpoint
CREATE TABLE `issues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`date_published` text NOT NULL,
	`unsure_date` integer DEFAULT false NOT NULL,
	`is_legacy` integer DEFAULT false NOT NULL,
	`num_pages` integer DEFAULT 0 NOT NULL,
	`shortlink` text,
	`volume_num` integer,
	`issue_num` integer,
	`description` text,
	`has_pdf` integer DEFAULT false NOT NULL,
	`has_pages` integer DEFAULT false NOT NULL,
	`cover_uploaded` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`issue_content` text DEFAULT '[]' NOT NULL,
	`contributors` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `issues_slug_unique` ON `issues` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_issues_date_published` ON `issues` (`date_published`);--> statement-breakpoint
CREATE INDEX `idx_issues_volume` ON `issues` (`volume_num`);--> statement-breakpoint
CREATE INDEX `idx_issues_is_legacy` ON `issues` (`is_legacy`);--> statement-breakpoint
CREATE INDEX `idx_issues_status` ON `issues` (`status`);
--> statement-breakpoint
INSERT INTO `categories` (`slug`, `label`) VALUES
  ('press-issue', 'Press Issues'),
  ('graduation-magazine', 'Graduation Magazines'),
  ('freshmanual', 'Freshmanuals'),
  ('uaap-primer', 'UAAP Primers'),
  ('other', 'Others');
