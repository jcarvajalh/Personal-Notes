"use client";

// Proveedor de tema propio (SE-001: claro/oscuro/sistema sin parpadeo). Sustituye
// a `next-themes`, cuyo <script> antiparpadeo, al renderizarse dentro de un
// componente cliente, dispara en React 19 el error "Encountered a script tag
// while rendering React component". Aquí el script antiparpadeo vive en el <head>
// (componente servidor, ver app/layout.tsx) y este proveedor solo aplica la clase.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "theme";

function systemTheme(): Resolved {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStored(fallback: Theme): Theme {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : fallback;
}

function resolve(theme: Theme): Resolved {
  if (theme !== "system") return theme;
  return typeof window === "undefined" ? "light" : systemTheme();
}

/** Aplica la clase y `color-scheme` al <html>, opcionalmente sin transición. */
function applyTheme(resolved: Resolved, disableTransition: boolean) {
  const root = document.documentElement;
  let cleanup: (() => void) | undefined;
  if (disableTransition) {
    const style = document.createElement("style");
    style.append(document.createTextNode("*,*::before,*::after{transition:none!important}"));
    document.head.appendChild(style);
    cleanup = () => {
      // Forzar reflujo para que la transición desactivada surta efecto.
      window.getComputedStyle(document.body);
      document.head.removeChild(style);
    };
  }
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  cleanup?.();
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => readStored(defaultTheme));
  const [resolvedTheme, setResolvedTheme] = useState<Resolved>(() =>
    resolve(readStored(defaultTheme)),
  );

  // Aplica la clase cuando cambia el tema resuelto (efecto de DOM, sin setState).
  useEffect(() => {
    applyTheme(resolvedTheme, disableTransitionOnChange);
  }, [resolvedTheme, disableTransitionOnChange]);

  // Responde a cambios del tema del sistema cuando el modo es "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolvedTheme(systemTheme());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    setThemeState(next);
    setResolvedTheme(resolve(next));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: "system", resolvedTheme: "light", setTheme: () => {} };
  }
  return ctx;
}
