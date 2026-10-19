"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Smile, Star } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmojiPicker } from "@/components/emoji-picker";
import { PageIcon } from "@/components/page-icon";
import { usePageMutations } from "@/hooks/use-pages";
import { usePageActions } from "@/components/sidebar/page-menu";
import type { PageIcon as PageIconValue } from "@/lib/validators/pages";

interface PageHeaderProps {
  pageId: string;
  initialTitle: string;
  initialIcon: PageIconValue | null;
  initialFavorite: boolean;
}

const RANDOM_EMOJIS = ["📝", "💡", "🚀", "📚", "✅", "🎯", "🌱", "🔥", "⭐", "🧠", "📌", "🗂️"];

export function PageHeader({
  pageId,
  initialTitle,
  initialIcon,
  initialFavorite,
}: PageHeaderProps) {
  const router = useRouter();
  const { rename, setIcon, favorite } = usePageMutations();

  const [title, setTitle] = useState(initialTitle);
  const [icon, setLocalIcon] = useState<PageIconValue | null>(initialIcon);
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [iconOpen, setIconOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // El componente se remonta por `key={pageId}` en la ruta, así que el estado
  // inicial siempre corresponde a la página actual (sin sincronizar en efecto).

  // Autosize del título.
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [title]);

  const scheduleTitleSave = (value: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      rename.mutate({ id: pageId, title: value.trim() });
    }, 500);
  };

  const commitIcon = (value: PageIconValue | null) => {
    setLocalIcon(value);
    setIcon.mutate({ id: pageId, icon: value });
    setIconOpen(false);
  };

  const actions = usePageActions(
    { id: pageId, title, isFavorite },
    // El renombrado aquí es inline (título), no en el menú.
  );

  const toggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    favorite.mutate({ id: pageId, favorite: next });
  };

  return (
    <div className="group/header mx-auto w-full max-w-(--content-max-width) px-12 pt-16">
      {/* Controles al hover */}
      <div className="mb-1 flex items-center gap-1">
        {!icon && (
          <Popover open={iconOpen} onOpenChange={setIconOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground gap-1.5 opacity-0 group-hover/header:opacity-100"
                />
              }
            >
              <Smile className="size-4" />
              Añadir icono
            </PopoverTrigger>
            <IconPopoverContent
              onSelect={commitIcon}
              onRandom={() =>
                commitIcon({
                  type: "emoji",
                  value: RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)],
                })
              }
            />
          </Popover>
        )}
        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
            onClick={toggleFavorite}
          >
            <Star className={cn("size-4", isFavorite && "fill-brand text-brand")} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Opciones de página" />}
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions
                .filter((a) => a.key !== "favorite")
                .map((a) => (
                  <div key={a.key}>
                    {a.separatorBefore && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      variant={a.variant}
                      onClick={() => {
                        a.onSelect();
                        if (a.key === "trash") {
                          toast.success("Página movida a la papelera");
                          router.push("/");
                        }
                      }}
                    >
                      <a.icon />
                      {a.label}
                    </DropdownMenuItem>
                  </div>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Icono grande */}
      {icon && (
        <Popover open={iconOpen} onOpenChange={setIconOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="hover:bg-muted mb-2 flex size-16 items-center justify-center rounded-lg"
                aria-label="Cambiar icono"
              />
            }
          >
            <PageIcon icon={icon} size={56} />
          </PopoverTrigger>
          <IconPopoverContent
            onSelect={commitIcon}
            onRemove={() => commitIcon(null)}
            onRandom={() =>
              commitIcon({
                type: "emoji",
                value: RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)],
              })
            }
          />
        </Popover>
      )}

      {/* Título (PG-001) */}
      <textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          scheduleTitleSave(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            // Lleva el foco al editor (ED): primer bloque.
            document.querySelector<HTMLElement>("[data-page-editor] .bn-block-content")?.focus();
          }
        }}
        rows={1}
        placeholder="Sin título"
        spellCheck
        className="font-heading placeholder:text-muted-foreground/40 w-full resize-none bg-transparent text-4xl font-semibold tracking-tight outline-none"
      />
    </div>
  );
}

function IconPopoverContent({
  onSelect,
  onRemove,
  onRandom,
}: {
  onSelect: (icon: PageIconValue) => void;
  onRemove?: () => void;
  onRandom?: () => void;
}) {
  return (
    <PopoverContent className="w-80 p-0" align="start">
      <div className="flex items-center justify-between gap-2 border-b p-2">
        <span className="text-muted-foreground px-1 text-xs font-medium">Emoji</span>
        <div className="flex gap-1">
          {onRandom && (
            <Button variant="ghost" size="xs" onClick={onRandom}>
              Aleatorio
            </Button>
          )}
          {onRemove && (
            <Button variant="ghost" size="xs" onClick={onRemove}>
              Quitar
            </Button>
          )}
        </div>
      </div>
      <EmojiPicker onSelect={(emoji) => onSelect({ type: "emoji", value: emoji })} />
    </PopoverContent>
  );
}
