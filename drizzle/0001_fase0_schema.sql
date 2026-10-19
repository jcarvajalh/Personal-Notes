CREATE TYPE "public"."activity_action" AS ENUM('created', 'edited', 'renamed', 'moved', 'archived', 'restored', 'deleted', 'duplicated', 'published', 'unpublished', 'imported', 'ai_edit', 'automation');--> statement-breakpoint
CREATE TYPE "public"."ai_role" AS ENUM('user', 'assistant', 'system', 'tool');--> statement-breakpoint
CREATE TYPE "public"."automation_status" AS ENUM('success', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."backlink_kind" AS ENUM('mention', 'link', 'embed', 'synced');--> statement-breakpoint
CREATE TYPE "public"."page_font" AS ENUM('default', 'serif', 'mono');--> statement-breakpoint
CREATE TYPE "public"."page_kind" AS ENUM('page', 'database', 'row', 'template');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('title', 'text', 'number', 'select', 'multi_select', 'status', 'date', 'checkbox', 'url', 'email', 'phone', 'files', 'relation', 'rollup', 'formula', 'created_time', 'last_edited_time', 'unique_id', 'button', 'rating', 'progress', 'location', 'ai');--> statement-breakpoint
CREATE TYPE "public"."reminder_channel" AS ENUM('push', 'email', 'both');--> statement-breakpoint
CREATE TYPE "public"."version_reason" AS ENUM('auto', 'manual', 'restore', 'before_ai', 'import');--> statement-breakpoint
CREATE TYPE "public"."view_type" AS ENUM('table', 'board', 'list', 'gallery', 'calendar', 'timeline', 'chart', 'map', 'feed');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"two_factor_enabled" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kind" "page_kind" DEFAULT 'page' NOT NULL,
	"parent_id" uuid,
	"database_id" uuid,
	"position" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"icon" jsonb,
	"cover" jsonb,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content_text" text DEFAULT '' NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"computed" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('spanish', immutable_unaccent("title")), 'A') || setweight(to_tsvector('spanish', immutable_unaccent("content_text")), 'B')) STORED,
	"embedding" vector(1024),
	"embedding_stale" boolean DEFAULT true NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"favorite_position" text,
	"is_locked" boolean DEFAULT false NOT NULL,
	"full_width" boolean DEFAULT false NOT NULL,
	"small_text" boolean DEFAULT false NOT NULL,
	"font" "page_font" DEFAULT 'default' NOT NULL,
	"show_toc" boolean DEFAULT false NOT NULL,
	"is_daily_note" boolean DEFAULT false NOT NULL,
	"daily_date" date,
	"template_config" jsonb,
	"unique_number" integer,
	"word_count" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"content_edited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_visited_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "pages_row_requires_database" CHECK ("pages"."kind" <> 'row' or "pages"."database_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'system',
	"accent_color" text DEFAULT 'blue',
	"default_font" "page_font" DEFAULT 'default',
	"locale" text DEFAULT 'es-CO',
	"timezone" text DEFAULT 'America/Bogota',
	"week_starts_on" smallint DEFAULT 1,
	"start_page" text DEFAULT 'last',
	"sidebar_width" integer DEFAULT 260,
	"sidebar_collapsed" boolean DEFAULT false,
	"daily_notes_parent_id" uuid,
	"daily_note_template_id" uuid,
	"inbox_page_id" uuid,
	"shortcuts" jsonb DEFAULT '{}'::jsonb,
	"ai_settings" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_daily_notes_parent_id_pages_id_fk" FOREIGN KEY ("daily_notes_parent_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_daily_note_template_id_pages_id_fk" FOREIGN KEY ("daily_note_template_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_inbox_page_id_pages_id_fk" FOREIGN KEY ("inbox_page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pages_tree_idx" ON "pages" USING btree ("workspace_id","parent_id","position") WHERE "pages"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "pages_database_idx" ON "pages" USING btree ("database_id","position") WHERE "pages"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "pages_properties_idx" ON "pages" USING gin ("properties" jsonb_path_ops);--> statement-breakpoint
CREATE INDEX "pages_search_idx" ON "pages" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "pages_title_trgm_idx" ON "pages" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "pages_embedding_idx" ON "pages" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "pages_recent_idx" ON "pages" USING btree ("workspace_id","last_visited_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "pages_favorite_idx" ON "pages" USING btree ("workspace_id","is_favorite") WHERE "pages"."is_favorite";--> statement-breakpoint
CREATE INDEX "pages_trash_idx" ON "pages" USING btree ("deleted_at") WHERE "pages"."deleted_at" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "pages_daily_date_unique" ON "pages" USING btree ("workspace_id","daily_date");