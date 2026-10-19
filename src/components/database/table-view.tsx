"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, MoreHorizontal, Plus, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TitleCell, ValueCell } from "@/components/database/cells";
import { CHIP } from "@/components/database/value-display";
import { useDatabaseMutations, useDatabaseRows } from "@/hooks/use-database";
import { applyView, groupRows, type RowGroup, type ViewConfig } from "@/lib/database/view-config";
import type { DatabaseBundle, DbProperty, DbRow, DbView } from "@/server/queries/databases";

const TYPE_LABELS: Record<string, string> = {
  text: "Texto",
  number: "Número",
  checkbox: "Casilla",
  select: "Selección",
  date: "Fecha",
};

const ADDABLE_TYPES = ["text", "number", "checkbox", "select", "date"] as const;

interface TableViewProps {
  pageId: string;
  bundle: DatabaseBundle;
  initialRows: DbRow[];
  view: DbView;
}

export function TableView({ pageId, bundle, initialRows, view }: TableViewProps) {
  const databaseId = bundle.database.id;
  const { data: rawRows = [] } = useDatabaseRows(databaseId, initialRows);
  const m = useDatabaseMutations(pageId, databaseId);
  const properties = bundle.properties;
  const config = view.config as ViewConfig;
  const rows = applyView(rawRows, properties, config);
  const groupProp = config.group_by ? properties.find((p) => p.id === config.group_by) : undefined;
  const groups = groupProp ? groupRows(rows, groupProp) : null;
  const totalCols = properties.length + 1;

  const renderRow = (row: DbRow) => (
    <tr key={row.id} className="group/row border-border hover:bg-muted/30 border-b">
      {properties.map((p) => (
        <td key={p.id} className="border-border h-9 border-r p-0 align-middle">
          {p.type === "title" ? (
            <TitleCell
              value={row.title}
              onCommit={(title) => m.updateTitle.mutate({ pageId: row.id, title })}
            />
          ) : (
            <ValueCell
              property={p}
              value={row.properties[p.id]}
              onCommit={(value) =>
                m.updateValue.mutate({ pageId: row.id, propertyId: p.id, value })
              }
              onConfigChange={(cfg) => m.updateConfig.mutate({ id: p.id, config: cfg })}
            />
          )}
        </td>
      ))}
      <td className="w-10 text-center align-middle">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Opciones de fila"
            className="text-muted-foreground hover:bg-muted mx-auto flex size-6 items-center justify-center rounded opacity-0 group-hover/row:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => m.trashRow.mutate({ id: row.id })}
            >
              <Trash2 />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-border border-y">
            {properties.map((p) => (
              <th key={p.id} className="border-border min-w-[160px] border-r text-left font-normal">
                <HeaderCell
                  property={p}
                  onRename={(name) => m.renameProperty.mutate({ id: p.id, name })}
                  onDelete={
                    p.type === "title" ? undefined : () => m.deleteProperty.mutate({ id: p.id })
                  }
                />
              </th>
            ))}
            <th className="w-10 p-0 text-center align-middle">
              <AddPropertyMenu
                onAdd={(type) =>
                  m.addProperty.mutate({ type, name: TYPE_LABELS[type] ?? "Propiedad" })
                }
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {groups
            ? groups.map((g) => (
                <GroupRows key={g.key} group={g} totalCols={totalCols} renderRow={renderRow} />
              ))
            : rows.map((row) => renderRow(row))}
        </tbody>
      </table>

      <button
        type="button"
        onClick={() => m.createRow.mutate()}
        className="text-muted-foreground hover:bg-muted border-border flex w-full items-center gap-2 border-b px-2 py-2 text-sm"
      >
        <Plus className="size-4" />
        Nueva fila
      </button>

      <p className="text-muted-foreground px-2 py-2 text-xs">
        {rows.length} {rows.length === 1 ? "fila" : "filas"}
      </p>
    </div>
  );
}

function GroupRows({
  group,
  totalCols,
  renderRow,
}: {
  group: RowGroup;
  totalCols: number;
  renderRow: (row: DbRow) => React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <tr className="border-border bg-muted/40 border-b">
        <td colSpan={totalCols} className="px-2 py-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 text-sm"
          >
            <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-xs",
                CHIP[group.color ?? "gray"] ?? CHIP.gray,
              )}
            >
              {group.label}
            </span>
            <span className="text-muted-foreground text-xs">{group.rows.length}</span>
          </button>
        </td>
      </tr>
      {open && group.rows.map((r) => renderRow(r))}
    </>
  );
}

function HeaderCell({
  property,
  onRename,
  onDelete,
}: {
  property: DbProperty;
  onRename: (name: string) => void;
  onDelete?: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(property.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  const commit = () => {
    setRenaming(false);
    const name = draft.trim();
    if (name && name !== property.name) onRename(name);
    else setDraft(property.name);
  };

  if (renaming) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(property.name);
            setRenaming(false);
          }
        }}
        className="bg-background ring-ring m-1 h-6 w-[calc(100%-0.5rem)] rounded px-1.5 text-sm ring-1 outline-none"
      />
    );
  }

  return (
    <div className="group/h flex items-center gap-1 px-2 py-1.5">
      <button
        type="button"
        onDoubleClick={() => setRenaming(true)}
        className="text-muted-foreground min-w-0 flex-1 truncate text-left"
        title={`${property.name} · doble clic para renombrar`}
      >
        {property.name}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Opciones de propiedad"
          className="text-muted-foreground hover:bg-muted flex size-5 items-center justify-center rounded opacity-0 group-hover/h:opacity-100"
        >
          <MoreHorizontal className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => setRenaming(true)}>Renombrar</DropdownMenuItem>
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 />
                Eliminar propiedad
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AddPropertyMenu({ onAdd }: { onAdd: (type: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Añadir propiedad"
        className="text-muted-foreground hover:bg-muted mx-auto flex size-7 items-center justify-center rounded"
      >
        <Plus className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ADDABLE_TYPES.map((type) => (
          <DropdownMenuItem key={type} onClick={() => onAdd(type)}>
            {TYPE_LABELS[type]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
