"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Home, Search } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageIcon } from "@/components/page-icon";
import { usePageMutations } from "@/hooks/use-pages";
import { useDialogsStore } from "@/stores/dialogs";
import { searchPages } from "@/server/actions/pages";

export function MoveToDialog() {
  const target = useDialogsStore((s) => s.moveTarget);
  const closeMove = useDialogsStore((s) => s.closeMove);
  const { move } = usePageMutations();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const open = target !== null;

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["move-search", target?.id, query],
    queryFn: () => searchPages(query, target ? [target.id] : []),
    enabled: open,
  });

  const doMove = (parentId: string | null) => {
    if (!target) return;
    move.mutate(
      { id: target.id, parentId },
      {
        onSuccess: () => {
          toast.success("Página movida");
          closeMove();
          setQuery("");
          router.refresh();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          closeMove();
          setQuery("");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mover «{target?.title || "Sin título"}»</DialogTitle>
          <DialogDescription>Elige la página destino o muévela a la raíz.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-md border px-2.5">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar página…"
            className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="max-h-72 overflow-y-auto">
          <button
            type="button"
            onClick={() => doMove(null)}
            className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
          >
            <Home className="text-muted-foreground size-4" />
            Raíz del espacio
          </button>
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => doMove(r.id)}
              className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
            >
              <PageIcon icon={r.icon} />
              <span className="truncate">{r.title || "Sin título"}</span>
            </button>
          ))}
          {!isFetching && results.length === 0 && query.length > 0 && (
            <p className="text-muted-foreground px-2 py-3 text-sm">Sin resultados.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
