import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";

// Tipografía de la app: Inter para toda la UI (sans). Cormorant Garamond como
// serif disponible (opción de fuente de página "serif"). Mono: Geist Mono.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blocktion",
  description: "Workspace personal de notas, documentos y bases de datos.",
};

// BlockNote (móvil): el teclado virtual redimensiona el contenido.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${cormorant.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* SE-001: fija el tema antes de pintar (sin parpadeo). Script EXTERNO
            (no inline, para no disparar el aviso de React 19) y SÍNCRONO dentro
            del <head> (así bloquea hasta ejecutarse y no hay parpadeo; es la
            colocación que exige React 19 para scripts síncronos). El sync es
            intencionado aquí (archivo mínimo), por eso se silencia la regla. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
