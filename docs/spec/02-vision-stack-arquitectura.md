<!-- Extraído de docs/Notion_Personal_Especificacion.docx (fuente de verdad). Líneas 71-255 del documento original. No editar a mano salvo que cambie la especificación. -->

2\. Visión y principios

2.1 Qué es

Una aplicación web personal (un solo usuario) que replica las capacidades de Notion — páginas anidadas, editor de bloques, bases de datos con múltiples vistas, plantillas, búsqueda — y las amplía con funcionalidades que Notion no tiene o resuelve mal: grafo de conocimiento, notas diarias, repetición espaciada, IA sobre todo el workspace, automatizaciones potentes, API propia para n8n, recordatorios push reales, diagramas y dibujo integrados, y control total de los datos.

2.2 Principios de diseño

- **Single-user primero, multi-usuario posible.** El esquema incluye workspace_id y user_id para no cerrar la puerta, pero la UI y la lógica asumen un único dueño. No se implementan permisos por página ni colaboración en tiempo real.

- **Velocidad percibida.** Actualizaciones optimistas, autosave con debounce, navegación instantánea entre páginas, virtualización en listas largas. Objetivo: abrir una página en \< 300 ms con la base de datos despierta.

- **Keyboard-first.** Todo accesible por teclado: paleta de comandos (Ctrl/Cmd+K), menú "/", atajos Markdown, navegación por bloques.

- **Los datos son tuyos.** Exportación total en cualquier momento (Markdown, JSON, PDF, DOCX) y backups automáticos.

- **Simple por dentro.** Una sola app Next.js desplegada en Vercel, una sola base Postgres. Nada de microservicios.

- **Progresivo.** Construir un MVP sólido (P0) y añadir capas. Cada fase deja la app usable.

2.3 Qué queda fuera (explícitamente)

- Colaboración en tiempo real multi-cursor y edición simultánea de varios usuarios.

- Permisos granulares, equipos, invitados, facturación.

- Apps móviles nativas (se cubre con PWA instalable).

- Edición offline completa con sincronización bidireccional en la primera versión (queda como P2, ver PW-004).

3\. Stack tecnológico

| **Capa** | **Tecnología** | **Motivo / notas** |
|----|----|----|
| Framework | Next.js (App Router, última estable) + React + TypeScript estricto | SSR/RSC, Server Actions, despliegue nativo en Vercel. |
| Editor | BlockNote (@blocknote/core, @blocknote/react, @blocknote/mantine o @blocknote/shadcn) | Editor de bloques estilo Notion sobre ProseMirror/TipTap. Extensible con bloques, estilos e inline content personalizados. |
| Editor (extras) | Paquetes XL de BlockNote: multi-column, exportadores PDF/DOCX, IA | Licencia GPL-3.0 o comercial. Para uso personal no publicado como producto cerrado, GPL es suficiente (ver sección 13). |
| Base de datos | Postgres en Neon (rama production) | JSONB para documentos y valores de propiedades; búsqueda full-text nativa; extensiones pg_trgm y vector (pgvector). |
| ORM / migraciones | Drizzle ORM + drizzle-kit | Tipado end-to-end, SQL cercano, migraciones versionadas. |
| Driver | @neondatabase/serverless (según indique el skill de Neon) | HTTP para consultas simples desde funciones serverless; WebSocket/Pool cuando se necesiten transacciones interactivas. |
| Autenticación | Better Auth (gestionado por Neon si está disponible en el proyecto; si no, Better Auth autoalojado) | Email + contraseña, passkeys y TOTP 2FA. Registro deshabilitado tras crear el usuario dueño. |
| Archivos | Object Storage de Neon (5 GB) o Vercel Blob / Cloudflare R2 | Imágenes, PDFs, adjuntos, covers. Subida directa con URL firmada. |
| UI | Tailwind CSS + shadcn/ui (Radix) + lucide-react | Componentes accesibles y personalizables. |
| Estado cliente | Zustand (UI) + TanStack Query (datos de servidor en cliente) | Cache, invalidación y updates optimistas. |
| Tablas de BD | TanStack Table + TanStack Virtual | Vistas tabla con miles de filas, redimensionado, columnas fijas. |
| Drag & drop | dnd-kit | Sidebar, tablero kanban, reordenar propiedades y vistas. |
| Paleta de comandos | cmdk | Ctrl/Cmd+K: búsqueda y acciones. |
| Calendario / timeline | Componentes propios sobre date-fns (o FullCalendar si se justifica) | Vistas calendario y línea de tiempo. |
| Gráficos | Recharts | Vista "Gráfico" de bases de datos y dashboards. |
| Matemáticas | KaTeX | Ecuaciones en línea y en bloque. |
| Código | Shiki | Resaltado de sintaxis en bloques de código. |
| Diagramas | Mermaid | Bloque de diagramas desde texto. |
| Dibujo | Excalidraw (@excalidraw/excalidraw) | Bloque de pizarra a mano alzada. |
| Fórmulas | Motor propio (parser con Chevrotain o escrito a mano) + evaluador en TS | Sintaxis compatible con fórmulas de Notion 2.0. |
| Fechas recurrentes | rrule | Recordatorios y plantillas recurrentes. |
| IA | Claude API vía Vercel AI SDK (ai, @ai-sdk/anthropic) | Streaming, tool calling. Embeddings con Voyage AI u otro proveedor (Claude no genera embeddings). |
| Validación | Zod | Entradas de actions, API y formularios. |
| Notificaciones | Web Push (VAPID, librería web-push) + email opcional (Resend) | Recordatorios reales en escritorio y móvil. |
| Jobs programados | Vercel Cron Jobs | Recordatorios, plantillas recurrentes, backups, embeddings pendientes. |
| Testing | Vitest (unit), Playwright (E2E) | Motor de fórmulas y filtros con cobertura alta. |
| Calidad | ESLint, Prettier, TypeScript strict, Husky + lint-staged |  |
| Despliegue | Vercel (producción + previews) · Neon branches para previews |  |

4\. Arquitectura general

4.1 Vista de alto nivel

> ┌──────────────────────────── Navegador / PWA ────────────────────────────┐
>
> │ Next.js (React) · BlockNote · TanStack Query · Zustand │
>
> │ Service Worker (cache, push) · IndexedDB (cache local, cola offline) │
>
> └───────────────▲──────────────────────────────────────▲──────────────────┘
>
> │ RSC / Server Actions │ REST /api/v1 (tokens)
>
> ┌───────────────┴────────────── Vercel ────────────────┴──────────────────┐
>
> │ App Router: páginas RSC · Server Actions · Route Handlers │
>
> │ Capa de dominio: src/server/{queries,actions,services} │
>
> │ Motores: fórmulas · filtros/orden · rollups · automatizaciones │
>
> │ Vercel Cron: recordatorios · recurrentes · backups · embeddings │
>
> └──────┬───────────────────────┬──────────────────────┬────────────────────┘
>
> │ Drizzle + driver Neon │ SDK storage │ HTTPS
>
> ┌──────▼──────┐ ┌───────▼────────┐ ┌───────▼──────────────────┐
>
> │ Neon │ │ Object Storage │ │ Claude API · Voyage │
>
> │ Postgres │ │ (archivos) │ │ Web Push · Resend · n8n │
>
> └─────────────┘ └────────────────┘ └──────────────────────────┘

4.2 Capas del servidor

- **Rutas (\`src/app\`)**: solo componen UI y llaman a queries. Sin lógica de negocio.

- **Queries (\`src/server/queries\`)**: lecturas tipadas. Siempre filtran por workspace_id del usuario autenticado.

- **Actions (\`src/server/actions\`)**: mutaciones con "use server". Patrón: requireUser() → validar con Zod → llamar a un service → revalidatePath/Tag → devolver resultado tipado { ok, data } \| { ok:false, error }.

- **Services (\`src/server/services\`)**: lógica de dominio reutilizable por actions, API REST, cron y automatizaciones (ej. pageService.create, databaseService.queryView).

- **Engines (\`src/lib/engines\`)**: código puro y testeable sin dependencias de BD — formula, filter, sort, rollup, group, rrule, markdown.

- **API pública (\`src/app/api/v1\`)**: Route Handlers autenticados con token personal (Bearer). Reutilizan services.

4.3 Flujo de guardado del editor

1.  BlockNote emite onChange. El cliente guarda el documento en estado local y en IndexedDB (protección ante cierre accidental).

2.  Debounce de **800 ms** (y guardado forzado al salir de la página o perder foco) → Server Action savePageContent(pageId, content, baseVersion).

3.  El servidor compara baseVersion con pages.version. Si coincide: guarda, incrementa versión, extrae content_text, actualiza backlinks y menciones, marca embedding como pendiente. Si no coincide (otra pestaña/dispositivo editó): devuelve conflicto y el cliente ofrece recargar o sobrescribir.

4.  Cada 10 minutos de edición activa, o al cerrar la sesión de edición, se crea un snapshot en page_versions.

5.  Indicador de estado en la cabecera: "Guardando…", "Guardado", "Sin conexión — cambios en cola".

4.4 Consulta de bases de datos

Las filas de una base de datos son páginas (pages.kind = row). Sus valores viven en pages.properties (JSONB, clave = id de propiedad). Las relaciones viven en relation_links. Para una vista:

1.  Se carga la definición: propiedades + configuración de la vista (filtros, orden, agrupación).

2.  Los filtros y ordenamientos sobre propiedades almacenadas se **traducen a SQL** (operadores JSONB, índices GIN) en databaseService.queryView.

3.  Fórmulas, rollups y filtros sobre ellos se calculan en el servidor en TypeScript sobre el conjunto ya filtrado por SQL. Resultados cacheados en pages.computed e invalidados al cambiar dependencias.

4.  Paginación por cursor (100 filas por página) y virtualización en el cliente.

4.5 Estructura de carpetas

> /
>
> ├─ CLAUDE.md
>
> ├─ docs/ SPEC.md · PROGRESS.md · DECISIONS.md
>
> ├─ drizzle/ \# migraciones generadas
>
> ├─ public/ manifest.webmanifest · icons/ · sw.js
>
> ├─ src/
>
> │ ├─ app/
>
> │ │ ├─ (auth)/login/ · setup/ \# setup = crear usuario dueño la 1ª vez
>
> │ │ ├─ (app)/layout.tsx \# sidebar + topbar + providers
>
> │ │ ├─ (app)/\[pageId\]/page.tsx \# página / base de datos
>
> │ │ ├─ (app)/today/ · graph/ · inbox/ · review/ · trash/ · settings/
>
> │ │ ├─ p/\[slug\]/ \# páginas publicadas (públicas)
>
> │ │ └─ api/ auth/\[...all\] · v1/ · cron/ · upload/ · webhooks/ · ai/
>
> │ ├─ components/
>
> │ │ ├─ ui/ \# shadcn
>
> │ │ ├─ editor/ \# BlockNote + bloques custom
>
> │ │ ├─ database/ views/{table,board,list,gallery,calendar,timeline,chart,map,feed}
>
> │ │ ├─ sidebar/ · command-palette/ · page-header/ · peek/
>
> │ ├─ server/ db/{schema/\*.ts,index.ts} · queries/ · actions/ · services/ · auth.ts
>
> │ ├─ lib/ engines/{formula,filter,sort,rollup,group} · utils/ · validators/
>
> │ ├─ hooks/ · stores/ · types/
>
> ├─ tests/ unit/ · e2e/
>
> ├─ neon.ts · drizzle.config.ts · vercel.json (crons)
