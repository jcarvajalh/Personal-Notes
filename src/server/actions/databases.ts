"use server";

import { revalidatePath } from "next/cache";

import { requireUser, UnauthorizedError } from "@/server/session";
import { ActionResult, fail, ok } from "@/lib/result";
import {
  addPropertySchema,
  createDatabaseSchema,
  createRowSchema,
  createViewSchema,
  propertyIdSchema,
  renamePropertySchema,
  renameViewSchema,
  updatePropertyConfigSchema,
  updateRowValueSchema,
  updateViewConfigSchema,
  viewIdSchema,
} from "@/lib/validators/databases";
import * as dbService from "@/server/services/databases";
import {
  getDatabaseByPageId,
  getDatabaseRows,
  type DatabaseBundle,
  type DbRow,
} from "@/server/queries/databases";

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await fn());
  } catch (error) {
    if (error instanceof UnauthorizedError) return fail("No autenticado");
    const message = error instanceof Error ? error.message : "Error desconocido";
    return fail(message);
  }
}

// =============================== Lecturas ====================================

export async function loadDatabase(pageId: string): Promise<DatabaseBundle | null> {
  const ctx = await requireUser();
  return getDatabaseByPageId(ctx.workspaceId, pageId);
}

export async function listRows(databaseId: string): Promise<DbRow[]> {
  const ctx = await requireUser();
  return getDatabaseRows(ctx.workspaceId, databaseId);
}

// =============================== Mutaciones ==================================

export async function createDatabaseAction(input: {
  parentId?: string | null;
  title?: string;
  viewType?: string;
  isInline?: boolean;
}): Promise<ActionResult<{ pageId: string; databaseId: string }>> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = createDatabaseSchema.parse(input);
    const result = await dbService.createDatabase(ctx, parsed);
    revalidatePath("/", "layout");
    return result;
  });
}

export async function addPropertyAction(input: {
  databaseId: string;
  type: string;
  name: string;
}): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = addPropertySchema.parse(input);
    return dbService.addProperty(ctx, parsed);
  });
}

export async function renamePropertyAction(input: {
  id: string;
  name: string;
}): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = renamePropertySchema.parse(input);
    await dbService.renameProperty(ctx, parsed.id, parsed.name);
    return undefined;
  });
}

export async function updatePropertyConfigAction(input: {
  id: string;
  config: Record<string, unknown>;
}): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = updatePropertyConfigSchema.parse(input);
    await dbService.updatePropertyConfig(ctx, parsed.id, parsed.config);
    return undefined;
  });
}

export async function deletePropertyAction(input: { id: string }): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = propertyIdSchema.parse(input);
    await dbService.deleteProperty(ctx, parsed.id);
    return undefined;
  });
}

export async function createRowAction(input: {
  databaseId: string;
}): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = createRowSchema.parse(input);
    return dbService.createRow(ctx, parsed.databaseId);
  });
}

export async function updateRowValueAction(input: {
  pageId: string;
  propertyId: string;
  value: unknown;
}): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = updateRowValueSchema.parse(input);
    await dbService.updateRowValue(ctx, parsed);
    return undefined;
  });
}

export async function createViewAction(input: {
  databaseId: string;
  type: string;
  name: string;
}): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = createViewSchema.parse(input);
    return dbService.createView(ctx, parsed);
  });
}

export async function renameViewAction(input: { id: string; name: string }): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = renameViewSchema.parse(input);
    await dbService.renameView(ctx, parsed.id, parsed.name);
    return undefined;
  });
}

export async function updateViewConfigAction(input: {
  id: string;
  config: Record<string, unknown>;
}): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = updateViewConfigSchema.parse(input);
    await dbService.setViewConfig(ctx, parsed.id, parsed.config);
    return undefined;
  });
}

export async function deleteViewAction(input: { id: string }): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requireUser();
    const parsed = viewIdSchema.parse(input);
    await dbService.deleteView(ctx, parsed.id);
    return undefined;
  });
}
