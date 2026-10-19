"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageIcon } from "@/components/page-icon";
import { useFavorites, usePageMutations, useRecents } from "@/hooks/use-pages";

export default function HomePage() {
  const router = useRouter();
  const { create } = usePageMutations();
  const recents = useRecents(8);
  const favorites = useFavorites();

  return (
    <div className="mx-auto w-full max-w-(--content-max-width) px-12 py-16">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Inicio</h1>
        <Button onClick={() => create.mutate({}, { onSuccess: (d) => router.push(`/${d.id}`) })}>
          <FilePlus />
          Nueva página
        </Button>
      </header>

      <section className="mb-10">
        <h2 className="text-muted-foreground mb-2 text-sm font-medium">Recientes</h2>
        {recents.data && recents.data.length > 0 ? (
          <ul className="grid gap-1">
            {recents.data.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/${r.id}`}
                  className="hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <PageIcon icon={r.icon} />
                  <span className="truncate">{r.title || "Sin título"}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Aún no has visitado páginas. Crea una para empezar.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-muted-foreground mb-2 text-sm font-medium">Favoritos</h2>
        {favorites.data && favorites.data.length > 0 ? (
          <ul className="grid gap-1">
            {favorites.data.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/${f.id}`}
                  className="hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <PageIcon icon={f.icon} />
                  <span className="truncate">{f.title || "Sin título"}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Marca páginas con la estrella para verlas aquí.
          </p>
        )}
      </section>
    </div>
  );
}
