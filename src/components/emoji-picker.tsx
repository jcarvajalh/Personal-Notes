"use client";

import { EmojiPicker as Frimousse } from "frimousse";

import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

/** Selector de emojis (PG-002) con búsqueda, sobre frimousse. */
export function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  return (
    <Frimousse.Root
      className={cn(
        "bg-popover text-popover-foreground isolate flex h-72 w-full flex-col",
        className,
      )}
      locale="es"
      emojiVersion={15}
      onEmojiSelect={(emoji) => onSelect(emoji.emoji)}
      columns={9}
    >
      <Frimousse.Search
        placeholder="Buscar emoji…"
        className="bg-background focus-visible:ring-ring mx-2 mt-2 h-8 rounded-md border px-2 text-sm outline-none focus-visible:ring-2"
      />
      <Frimousse.Viewport className="relative flex-1 outline-none">
        <Frimousse.Loading className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
          Cargando…
        </Frimousse.Loading>
        <Frimousse.Empty className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
          Sin resultados.
        </Frimousse.Empty>
        <Frimousse.List
          className="pb-2 select-none"
          components={{
            CategoryHeader: ({ category, ...props }) => (
              <div
                className="bg-popover text-muted-foreground px-3 pt-2 pb-1 text-xs font-medium"
                {...props}
              >
                {category.label}
              </div>
            ),
            Row: ({ children, ...props }) => (
              <div className="scroll-my-1 px-1.5" {...props}>
                {children}
              </div>
            ),
            Emoji: ({ emoji, ...props }) => (
              <button
                type="button"
                className="hover:bg-muted data-[active]:bg-muted flex size-8 items-center justify-center rounded-md text-lg"
                {...props}
              >
                {emoji.emoji}
              </button>
            ),
          }}
        />
      </Frimousse.Viewport>
    </Frimousse.Root>
  );
}
