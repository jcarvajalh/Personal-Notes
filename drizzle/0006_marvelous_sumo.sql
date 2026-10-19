CREATE TABLE "database_properties" (
	"id" uuid PRIMARY KEY NOT NULL,
	"database_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "property_type" NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" text,
	"position" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "database_views" (
	"id" uuid PRIMARY KEY NOT NULL,
	"database_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "view_type" NOT NULL,
	"position" text NOT NULL,
	"host_page_id" uuid,
	"host_block_id" text,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "databases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"is_inline" boolean DEFAULT false NOT NULL,
	"title_property_id" uuid,
	"default_view_id" uuid,
	"row_open_mode" text DEFAULT 'side_peek' NOT NULL,
	"unique_id_prefix" text,
	"next_unique_number" integer DEFAULT 1 NOT NULL,
	"sub_items_property_id" uuid,
	"dependencies_property_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "database_properties" ADD CONSTRAINT "database_properties_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_views" ADD CONSTRAINT "database_views_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_views" ADD CONSTRAINT "database_views_host_page_id_pages_id_fk" FOREIGN KEY ("host_page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "databases" ADD CONSTRAINT "databases_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "databases" ADD CONSTRAINT "databases_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "database_properties_name_unique" ON "database_properties" USING btree ("database_id","name");--> statement-breakpoint
CREATE INDEX "database_properties_db_idx" ON "database_properties" USING btree ("database_id","position");--> statement-breakpoint
CREATE INDEX "database_views_db_idx" ON "database_views" USING btree ("database_id","position");--> statement-breakpoint
CREATE INDEX "database_views_host_idx" ON "database_views" USING btree ("host_page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "databases_page_id_unique" ON "databases" USING btree ("page_id");