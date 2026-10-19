import { FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PageIcon as PageIconValue } from "@/lib/validators/pages";

interface PageIconProps {
  icon: PageIconValue | null;
  className?: string;
  /** Tamaño en px para emojis/imágenes. */
  size?: number;
}

/**
 * Renderiza el icono de una página (PG-002): emoji, imagen subida o, si no hay
 * icono, un marcador neutro. El tipo "icon" (librería lucide) se renderiza como
 * emoji si trae un carácter; el selector de iconos de librería llega más adelante.
 */
export function PageIcon({ icon, className, size = 16 }: PageIconProps) {
  if (!icon) {
    return (
      <FileText
        className={cn("text-muted-foreground shrink-0", className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  if (icon.type === "file") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon.value}
        alt=""
        className={cn("shrink-0 rounded-sm object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  // emoji / icon (carácter)
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center leading-none", className)}
      style={{ fontSize: size, width: size, height: size, color: icon.color }}
      aria-hidden
    >
      {icon.value}
    </span>
  );
}
