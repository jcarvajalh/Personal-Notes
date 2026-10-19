"use client";

import { useRouter } from "next/navigation";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageIcon } from "@/components/page-icon";
import { useTrash, usePageMutations } from "@/hooks/use-pages";

export default function TrashPage() {
  const router = useRouter();
  const trash = useTrash();
  const { restore, destroy, emptyTrash } = usePageMutations();

  const items = trash.data ?? [];

  return (
    <div className="mx-auto w-full max-w-(--content-max-width) px-12 py-16">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Papelera</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Las páginas se eliminan definitivamente tras 30 días.
          </p>
        </div>
        {items.length > 0 && (
          <Button
            variant="destructive"
            onClick={() =>
              emptyTrash.mutate(undefined, {
                onSuccess: () => toast.success("Papelera vaciada"),
              })
            }
          >
            <Trash2 />
            Vaciar papelera
          </Button>
        )}
      </header>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">La papelera está vacía.</p>
      ) : (
        <ul className="grid gap-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="group hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
            >
              <PageIcon icon={item.icon} />
              <span className="min-w-0 flex-1 truncate">{item.title || "Sin título"}</span>
              <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    restore.mutate(
                      { id: item.id },
                      {
                        onSuccess: () => {
                          toast.success("Página restaurada");
                          router.refresh();
                        },
                      },
                    )
                  }
                >
                  <RotateCcw />
                  Restaurar
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Eliminar definitivamente"
                  onClick={() =>
                    destroy.mutate(
                      { id: item.id },
                      { onSuccess: () => toast.success("Página eliminada definitivamente") },
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
