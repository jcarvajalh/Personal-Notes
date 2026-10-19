CREATE TABLE "page_groups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"position" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "page_groups" ADD CONSTRAINT "page_groups_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "page_groups_ws_idx" ON "page_groups" USING btree ("workspace_id","position");--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_group_id_page_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."page_groups"("id") ON DELETE set null ON UPDATE no action;