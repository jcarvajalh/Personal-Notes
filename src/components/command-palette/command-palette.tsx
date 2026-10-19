"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, FilePlus, Moon, Settings, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useTheme } from "@/components/theme-provider";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { PageIcon } from "@/components/page-icon";
import { useDialogsStore } from "@/stores/dialogs";
import { pageKeys, usePageMutations, useRecents } from "@/hooks/use-pages";
import { searchContent, searchPages } from "@/server/actions/pages";
import { createDatabaseAction } from "@/server/actions/databases";
import { OFFERED_VIEW_TYPES, VIEW_LABELS } from "@/lib/database/types";
import { splitHighlights } from "@/lib/search";

export function CommandPalette() {
  const open = useDialogsStore((s) => s.commandOpen);
  const setOpen = useDialogsStore((s) => s.setCommandOpen);
  const router = useRouter();
  const { setTheme } = useTheme();
  const { create } = usePageMutations();
  const qc = useQueryClient();

  const newDatabase = async (viewType: string) => {
    const res = await createDatabaseAction({ viewType });
    if (res.ok) {
      qc.invalidateQueries({ queryKey: pageKeys.all });
      router.push(`/${res.data.pageId}`);
    } else {
      toast.error(res.error);
    }
  };

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const recents = useRecents(8);
  const { data: results = [] } = useQuery({
    queryKey: ["command-search", debounced],
    queryFn: () => searchPages(debounced),
    enabled: open && debounced.trim().length > 0,
  });
  const { data: contentResults = [] } = useQuery({
    queryKey: ["command-content", debounced],
    queryFn: () => searchContent(debounced),
    enabled: open && debounced.trim().length > 0,
  });

  const go = (path: string) => {
    setOpen(false);
    setQuery("");
    router.push(path);
  };

  const run = (fn: () => void) => {
    setOpen(false);
    setQuery("");
    fn();
  };

  const hasQuery = debounced.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQuery("");
      }}
    >
      <DialogContent
        className="top-1/4 translate-y-0 overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Paleta de comandos</DialogTitle>
        <DialogDescription className="sr-only">Busca páginas y ejecuta acciones</DialogDescription>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar páginas o ejecutar una acción…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>

            {hasQuery && results.length > 0 && (
              <CommandGroup heading="Páginas">
                {results.map((r) => (
                  <CommandItem key={r.id} value={`page-${r.id}`} onSelect={() => go(`/${r.id}`)}>
                    <PageIcon icon={r.icon} />
                    <span className="truncate">{r.title || "Sin título"}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {hasQuery && contentResults.length > 0 && (
              <CommandGroup heading="En el contenido">
                {contentResults.map((r) => (
                  <CommandItem
                    key={`c-${r.id}`}
                    value={`content-${r.id}`}
                    onSelect={() => go(`/${r.id}`)}
                    className="items-start"
                  >
                    <PageIcon icon={r.icon} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{r.title || "Sin título"}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {splitHighlights(r.snippet).map((seg, i) =>
                          seg.mark ? (
                            <mark
                              key={i}
                              className="bg-highlight text-highlight-foreground rounded-sm"
                            >
                              {seg.text}
                            </mark>
                          ) : (
                            <span key={i}>{seg.text}</span>
                          ),
                        )}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!hasQuery && recents.data && recents.data.length > 0 && (
              <CommandGroup heading="Recientes">
                {recents.data.map((r) => (
                  <CommandItem key={r.id} value={`recent-${r.id}`} onSelect={() => go(`/${r.id}`)}>
                    <PageIcon icon={r.icon} />
                    <span className="truncate">{r.title || "Sin título"}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="Acciones">
              <CommandItem
                value="accion nueva pagina"
                onSelect={() =>
                  run(() => create.mutate({}, { onSuccess: (d) => router.push(`/${d.id}`) }))
                }
              >
                <FilePlus />
                Nueva página
              </CommandItem>
              <CommandItem value="accion papelera" onSelect={() => go("/trash")}>
                <Trash2 />
                Abrir papelera
              </CommandItem>
              <CommandItem value="accion ajustes" onSelect={() => go("/settings")}>
                <Settings />
                Abrir ajustes
              </CommandItem>
              <CommandItem value="accion tema claro" onSelect={() => run(() => setTheme("light"))}>
                <Sun />
                Tema claro
              </CommandItem>
              <CommandItem value="accion tema oscuro" onSelect={() => run(() => setTheme("dark"))}>
                <Moon />
                Tema oscuro
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="Base de datos">
              {OFFERED_VIEW_TYPES.map((vt) => (
                <CommandItem
                  key={vt}
                  value={`base de datos vista ${VIEW_LABELS[vt]}`}
                  onSelect={() => run(() => void newDatabase(vt))}
                >
                  <Database />
                  Vista de {(VIEW_LABELS[vt] ?? vt).toLowerCase()}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
