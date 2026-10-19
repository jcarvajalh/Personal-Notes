import { pgEnum } from "drizzle-orm/pg-core";

// Tipos enumerados de Postgres — sección 6.3 de la especificación.

export const pageKind = pgEnum("page_kind", ["page", "database", "row", "template"]);

export const pageFont = pgEnum("page_font", ["default", "serif", "mono"]);

export const propertyType = pgEnum("property_type", [
  "title",
  "text",
  "number",
  "select",
  "multi_select",
  "status",
  "date",
  "checkbox",
  "url",
  "email",
  "phone",
  "files",
  "relation",
  "rollup",
  "formula",
  "created_time",
  "last_edited_time",
  "unique_id",
  "button",
  "rating",
  "progress",
  "location",
  "ai",
]);

export const viewType = pgEnum("view_type", [
  "table",
  "board",
  "list",
  "gallery",
  "calendar",
  "timeline",
  "chart",
  "map",
  "feed",
  // "dashboard" (panel de control) no está en la spec 6.3 pero lo pide el dueño
  // (vista "Nuevo" de Notion). Ver DECISIONS.
  "dashboard",
]);

export const backlinkKind = pgEnum("backlink_kind", ["mention", "link", "embed", "synced"]);

export const versionReason = pgEnum("version_reason", [
  "auto",
  "manual",
  "restore",
  "before_ai",
  "import",
]);

export const reminderChannel = pgEnum("reminder_channel", ["push", "email", "both"]);

export const automationStatus = pgEnum("automation_status", ["success", "failed", "skipped"]);

export const activityAction = pgEnum("activity_action", [
  "created",
  "edited",
  "renamed",
  "moved",
  "archived",
  "restored",
  "deleted",
  "duplicated",
  "published",
  "unpublished",
  "imported",
  "ai_edit",
  "automation",
]);

export const aiRole = pgEnum("ai_role", ["user", "assistant", "system", "tool"]);
