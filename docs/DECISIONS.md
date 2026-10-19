# Decisiones de implementación (DECISIONS)

Decisiones no cubiertas (o que precisan matiz) respecto a la especificación.
Formato: ID · fecha · decisión · motivo.

## DEC-001 · 2026-10-18 · Next.js 16 + React 19 (Turbopack)

`create-next-app` instaló Next.js **16.4.2**, React **19.3** y Tailwind **4** (última
estable, como pide el stack). Turbopack es el bundler por defecto en Next 16.
Sin impacto en la arquitectura de la sección 4.

## DEC-002 · 2026-10-18 · Driver de Neon: WebSocket/Pool como cliente único (Fase 0)

La sección 3 indica `@neondatabase/serverless` con HTTP para consultas simples y
WebSocket/Pool para transacciones interactivas. En la Fase 0 se usa un **único
cliente** basado en `drizzle-orm/neon-serverless` (Pool sobre WebSocket) porque
Better Auth y las operaciones multi-tabla requieren transacciones. Si más adelante
hay rutas de lectura calientes, se añadirá un cliente `neon-http` complementario.
El Pool no abre conexión hasta la primera consulta, de modo que importar `db` sin
`DATABASE_URL` no falla (necesario para `next build` y la CLI).

## DEC-003 · 2026-10-18 · pages.database_id sin FK en Fase 0

`pages.database_id` (6.5) referencia `databases.id ON DELETE CASCADE`, pero la tabla
`databases` pertenece a la Fase 2. En la Fase 0 la columna existe **sin** la FK; la
restricción se añadirá con una migración al crear `databases`. El resto de columnas,
tipos, defaults, índices y el CHECK `kind='row' ⇒ database_id IS NOT NULL` se
implementan exactamente como en 6.5.

## DEC-004 · 2026-10-18 · Tablas de Better Auth escritas a mano (núcleo)

La sección 6.4 sugiere generarlas con `npx @better-auth/cli generate`. Se escribieron
a mano en `src/server/db/schema/auth.ts` para coincidir con 6.4 y con los nombres de
campo que espera Better Auth, evitando el import circular (auth → db → schema → auth)
y porque el entorno no tiene BD para iterar con la CLI. En la Fase 0 solo se usan las
tablas núcleo (`user`, `session`, `account`, `verification`) con email + contraseña.
Los plugins `passkey` y `two_factor` (AU-005/AU-006) añadirán sus tablas en la Fase 4.
`user.two_factor_enabled` se deja presente (default false) según 6.4.

## DEC-005 · 2026-10-18 · shadcn/ui con Base UI

El CLI actual de shadcn (`shadcn@4`, estilo `base-nova`) genera componentes sobre
**Base UI** en lugar de Radix. La especificación menciona "shadcn/ui (Radix)"; se
acepta el cambio porque sigue siendo shadcn/ui, los componentes son accesibles y es
lo que produce el CLI oficial hoy. El helper `cn` vive en `src/lib/utils.ts`.

## DEC-006 · 2026-10-18 · UUID v7 generados en la app

Según 6.1 los ids son uuid v7 generados en la app. Se implementó un generador propio
en `src/lib/ids.ts` (sin dependencia externa). Las tablas con PK uuid usan
`.$defaultFn(uuidv7)`; no se define default en la BD.

## DEC-007 · 2026-10-18 · Migración de extensiones + wrapper immutable_unaccent

Las extensiones (`pg_trgm`, `vector`, `unaccent`) y la función `immutable_unaccent`
van en una migración propia `0000_extensions.sql` que se aplica **antes** del
esquema, porque la columna generada `pages.search_vector` (6.5) usa esa función.
`unaccent()` es STABLE y no puede usarse en columnas generadas ni índices de
expresión; el wrapper la declara IMMUTABLE.

## DEC-008 · 2026-10-18 · @types/node ^22

Subido de `^20` (valor de create-next-app) a `^22` para resolver el peer dependency
de `vitest@5` sin `--legacy-peer-deps`. Coincide con el runtime Node 22.

## DEC-009 · 2026-10-18 · Rate limit de login y restricción de registro

AU-002: límite de 5 intentos/15 min en `/sign-in/email` vía `rateLimit.customRules`
de Better Auth; mensajes de error genéricos en el cliente. AU-003: un `databaseHook`
`user.create.before` rechaza cualquier email distinto de `OWNER_EMAIL`. AU-001: el
`databaseHook` `user.create.after` crea `workspace` + `user_settings` en una
transacción, y `/setup` solo se muestra si aún no existe ningún usuario.

## DEC-010 · 2026-10-18 · Rama de trabajo `develop`

El desarrollo ocurre en la rama `develop`. `main` queda como rama estable y
`production` se reservará para el despliegue en Vercel (rama de Neon `production`).

## DEC-012 · 2026-10-19 · Tipografía: Inter + Cormorant Garamond e interletraje

Fuente de UI **Inter** (sans) vía `next/font` (autohospedada; evita el salto de
layout del `@import` y carga la misma familia que el import de Google Fonts pedido).
**Cormorant Garamond** como serif disponible (pesos 300–700, normal/itálica) para la
opción de fuente de página "serif" (6.5). Reglas base en `globals.css`: cuerpo/párrafos
`letter-spacing: -0.02em`; títulos `h1–h6` `font-weight: 500` y `letter-spacing: -0.04em`.
Los `<h1>` de las pantallas pasaron de `font-semibold` (600) a `font-medium` (500) para
respetar la directiva. Ajusta/sustituye a Source Serif (mencionado en 9) por decisión de
diseño del dueño. Mono sigue siendo Geist Mono (JetBrains Mono queda pendiente).

## DEC-011 · 2026-10-18 · Sin `cacheComponents`; `proxy.ts` en lugar de `middleware.ts`

`create-next-app` activó `cacheComponents`/`partialPrefetching` (experimentales de
Next 16), incompatibles con `export const dynamic`/`runtime`. Se desactivan: la app
es intensamente dinámica (sesión y datos por usuario) y usa renderizado dinámico
convencional. Además, en Next 16 el convenio `middleware.ts` está deprecado a favor
de `proxy.ts` (función `proxy`); se adoptó el nuevo nombre. La lógica de protección
de rutas (AU-004) es idéntica.

## DEC-013 · 2026-10-18 · Fase 1: fuente de requisitos de seguridad y mapeo SEC-*

El prompt de la Fase 1 referencia `docs/spec/12-seguridad.md` e IDs `SEC-*` que **no
existen** en el repo (la spec llega a `11-licencias.md`). Se acuerda con el dueño usar
la **sección 8.2** de `09-no-funcionales-ui-api.md` como contrato de seguridad, con el
mapeo: SEC-006→AU-005/006 (passkeys y 2FA), SEC-040/041→subidas de archivos,
SEC-090→tests de seguridad, SEC-091→revisión manual del código nuevo.

## DEC-014 · 2026-10-18 · Librerías nuevas de la Fase 1

Se añaden (con su justificación): **@blocknote/core/react/mantine** + **shiki**
(editor y resaltado, 1B); **@tanstack/react-query** (datos de servidor en cliente,
updates optimistas, estado de guardado); **zustand** (estado de UI: sidebar, diálogos,
guardado); **@dnd-kit/core+sortable+utilities** (arrastrar y soltar del sidebar,
NV-003); **fractional-indexing** (orden con índice fraccionario, 6.1);
**next-themes** (tema claro/oscuro/sistema sin parpadeo, SE-001); **sonner** (toasts
con "Deshacer"; Base UI no trae toast); **frimousse** (selector de emojis para el
icono de página, PG-002); **cmdk** (paleta Ctrl/Cmd+K, SR-001). Pendientes para 1B/1C:
**@aws-sdk/client-s3** + **@aws-sdk/s3-request-presigner** (Neon Object Storage,
S3-compatible), **file-type** (validar magic bytes en subidas), **qrcode** (QR de TOTP),
**otpauth** (códigos TOTP en los E2E).

## DEC-015 · 2026-10-18 · Almacenamiento de archivos: Neon Object Storage (S3-compatible)

Entre Neon Object Storage, Vercel Blob y Cloudflare R2 (sección 3) se elige **Neon
Object Storage**: 5 GB incluidos y mismo proveedor que la BD. Es S3-compatible, por lo
que la integración (1B) usará el SDK de AWS S3 con URL firmada, validando tipo MIME y
tamaño (máx. 50 MB, 8.2) y usando nombres aleatorios en el bucket. Credenciales en
variables `STORAGE_*`.

## DEC-016 · 2026-10-18 · BlockNote variante Mantine

Se usa **@blocknote/mantine** (no `@blocknote/shadcn`) porque el shadcn del proyecto
está sobre **Base UI** (base-nova, DEC-005), cuyas APIs no coinciden con las que espera
el adaptador shadcn de BlockNote. La variante Mantine es autocontenida y se tematiza con
los tokens de diseño propios (1B).

## DEC-017 · 2026-10-18 · Tablas auxiliares de la Fase 1 (migración 0002)

Se crean `page_versions`, `page_visits`, `files` y `backlinks` (6.5–6.7) en
`drizzle/0002_*.sql`. `backlinks` se puebla al guardar (flujo 4.3) aunque el panel
(PG-015) sea de la Fase 4. Las tablas de los plugins passkey/two_factor (6.4) se
añadirán en la migración del bloque 1C.

## DEC-018 · 2026-10-18 · Regla eslint `react-hooks/refs` desactivada en archivos de dnd-kit

`eslint-plugin-react-hooks` v6 marca como error leer `isOver` o pasar `setNodeRef` de
los hooks de **@dnd-kit** (los confunde con refs accedidos en render). Es el uso
idiomático de la librería, así que se desactiva `react-hooks/refs` **solo** en
`sidebar.tsx` y `tree-node.tsx` con comentario. El resto de reglas de hooks siguen como
error; los `set-state-in-effect` se corrigieron de raíz (useSyncExternalStore y
remontaje por `key`).

## DEC-019 · 2026-10-18 · Tokens de diseño e identidad propia

Los tokens viven en un único lugar (`src/app/globals.css`): marca (`--brand*`),
resaltado de búsqueda (`--highlight*`) y medidas de layout (`--sidebar-width`,
`--content-max-width`, `--topbar-height`), además de la tipografía (DEC-012). El acento
de marca es un índigo propio (no la paleta de Notion).

## DEC-020 · 2026-10-19 · Passkeys: paquete `@better-auth/passkey`; 2FA del núcleo

En Better Auth 1.7.11 el plugin **passkey** no está en el núcleo; se publica aparte
como **`@better-auth/passkey`** (misma versión). Se instala y se usa su plugin de
servidor (`.`) y de cliente (`./client`). El 2FA TOTP (`two-factor`) sí está en el
núcleo (`better-auth/plugins/two-factor`). Ambas tablas (`two_factor`, `passkey`,
sección 6.4) se escriben a mano en `schema/auth.ts` (coherente con DEC-004) y se crean
en la migración `0003`. El login salta a `/login/2fa` vía `onTwoFactorRedirect` del
cliente (callback fuera de React → `window.location`). `/login/2fa` se añade a las
rutas públicas del `proxy`.

## DEC-021 · 2026-10-19 · Búsqueda full-text: headline sobre texto sin tildes

SR-002 usa `search_vector` (tsvector español + `immutable_unaccent`). Para que el
resaltado de `ts_headline` case con la consulta sin tildes, el headline se genera sobre
`immutable_unaccent(content_text)` con `plainto_tsquery('spanish', immutable_unaccent(q))`.
Consecuencia: el fragmento resaltado se muestra sin tildes (compromiso cosmético menor)
a cambio de resaltado consistente con o sin tildes. Los marcadores `[[h]]…[[/h]]` se
convierten a `<mark>` en el cliente (sin inyectar HTML, §8.2).

## DEC-022 · 2026-10-19 · Grupos del sidebar, multiselección y mejoras de UX

Mejoras sobre la Fase 1 a partir de feedback de uso:

- **Grupos personalizados** del sidebar: nueva tabla `page_groups` (id, workspace_id,
  name, position) y columna `pages.group_id` (FK `on delete set null`), migración
  `drizzle/0005_*.sql`. Las páginas raíz sin grupo siguen en la sección "Páginas";
  asignar una página a un grupo la promueve a raíz dentro de ese grupo. Solo afecta a
  páginas raíz; las subpáginas ignoran `group_id`. `SidebarNode` incluye `groupId` y la
  partición por grupo se hace en cliente (una sola consulta de raíz + una de grupos).
- **Multiselección**: estado efímero en `src/stores/selection.ts` (no persistido);
  acciones en lote `trashPagesAction` / `setFavoritePagesAction` (bucle en servidor, un
  solo `revalidatePath`). La barra de acciones vive en el sidebar.
- **Rendimiento**: `onMutate` optimista (crear/eliminar/lote) con rollback por snapshot
  y recarga en `onSettled`; `src/app/(app)/[pageId]/loading.tsx` para feedback inmediato
  al navegar.
- **UX**: cursor `pointer` global para elementos clicables (regla en `globals.css`);
  fondo del editor BlockNote transparente (quita la "card gris"); se elimina el toast de
  conflicto de edición (se conserva solo el indicador discreto de la barra superior).

## DEC-023 · 2026-10-19 · ThemeProvider propio (sustituye a next-themes)

En React 19.2+ / Next 16 el <script> antiparpadeo que `next-themes` renderiza dentro de
su `ThemeProvider` (componente cliente) dispara el error de consola "Encountered a
script tag while rendering React component" al re-renderizarse en cliente, y la librería
no ofrece desactivarlo. Se sustituye por `src/components/theme-provider.tsx` (mismo API
`useTheme`/`ThemeProvider`, SE-001: claro/oscuro/sistema, persistencia en localStorage
clave `theme`, clase en `<html>`). El proveedor evita `setState` en el cuerpo de efectos
(inicialización perezosa + handlers). `next-themes` queda sin usar (puede eliminarse de
package.json).

**Script antiparpadeo:** React 19 impone dos reglas sobre `<script>` en componentes:
(1) no se permite `<script>` **inline** (dispara "Encountered a script tag…"); (2) un
`<script>` **síncrono/defer** debe ir en el `<head>` raíz o llevar `async`. La solución
que cumple ambas: un archivo **externo** `public/theme-init.js` referenciado con un
`<script src>` **síncrono dentro del `<head>`** de `app/layout.tsx` (externo → evita la
regla 1; en el head → cumple la regla 2; síncrono → bloquea hasta ejecutarse, sin
parpadeo). Se descartó `next/script strategy="beforeInteractive"` porque en dev lo
renderiza fuera del `<head>` (error de orden). La regla de lint `@next/next/no-sync-scripts`
se silencia **solo en esa línea** (el sync es intencionado: archivo mínimo, no bloquea de
forma apreciable). La lógica del archivo debe mantenerse en sincronía con el proveedor.

## DEC-024 · 2026-10-19 · Bases de datos — Sub-bloque 1 (esquema + Tabla)

Arranca la Fase 2. Tablas `databases`, `database_properties`, `database_views`
(sección 6.6) en `schema/database.ts`, migración `drizzle/0006`. Desviaciones del
contrato por pragmatismo, a revisar en sub-bloques posteriores:

- `pages.database_id` **sin FK** a `databases` (evita import circular entre
  `core.ts` y `database.ts`). El borrado de filas al eliminar la BD se gestiona en
  el servicio/papelera (las filas son páginas `kind=row`; al enviar la BD a la
  papelera habrá que arrastrar sus filas — pendiente de cablear en papelera).
- `databases.title_property_id` y `default_view_id` como `uuid` sin FK (referencias
  circulares con properties/views).

Alcance del Sub-bloque 1: DB-001 (crear BD página completa, con Title + vista Tabla),
DB-002 parcial (añadir/renombrar/eliminar propiedad y editar config), DB-003 parcial
(title, text, number, checkbox, select, date), DB-013 (opciones de select al vuelo),
DB-020 parcial (pestañas: crear/renombrar/eliminar vistas Tabla), DB-021 parcial
(Vista Tabla con edición inline, añadir fila/propiedad, eliminar fila). Valores en
`pages.properties[propertyId]`; el título de la fila es `pages.title`. Edición de
celdas optimista (React Query). Entradas: `/` del editor ("Base de datos", crea
subpágina) y paleta de comandos ("Nueva base de datos", crea en la raíz). Vistas
tablero/lista/galería/calendario/cronograma/feed/gráfico/mapa: sub-bloques 2 y 3.

## DEC-025 · 2026-10-19 · Bases de datos — Sub-bloque 2 (vistas) y creación por categoría

Corrección de UX pedida por el dueño (doc `docs/vistas.docx`): "Base de datos" es una
**categoría** con las 8 vistas, no una opción única. El menú "/" del editor y la paleta
de comandos ofrecen las 8 (Tabla, Tablero, Galería, Lista, Feed, Panel de control,
Calendario, Cronograma); cada una crea la BD con esa vista por defecto. El "+" de
pestañas también ofrece las 8. `createDatabaseAction` acepta `viewType`.

Se añade el valor **`dashboard`** al enum `view_type` (migración `0007`), pese a no estar
en la spec 6.3, porque el dueño lo pide (vista "Panel de control", nueva en Notion).

Implementadas en este sub-bloque: **Tablero (Kanban** con arrastre dnd-kit; agrupa por la
primera propiedad `select`; soltar actualiza su valor), **Lista**, **Galería** y **Feed**
(`src/components/database/views.tsx`; display de valores de solo lectura en
`value-display.tsx`, reutilizado por las celdas). En Tablero/Lista/Galería/Feed, el título
enlaza a la página de la fila (`kind=row`). Pendientes (sub-bloque 3): Calendario,
Cronograma (timeline/Gantt) y Panel de control; muestran aviso "en construcción".

## DEC-026 · 2026-10-19 · Bases de datos inline + Sub-bloque 3 (Calendario/Cronograma/Panel)

Corrección pedida por el dueño: las vistas del menú "/" se muestran **embebidas en el
documento** (inline), no abren una subpágina. Se añade un bloque de editor
`databaseView` (`src/components/editor/blocks/database-block.tsx`, registrado en
`schema.ts`) que guarda el `pageId` de la página contenedora de la BD; `InlineDatabase`
(en `database-view.tsx`) carga bundle+filas por ese id (React Query) y renderiza
`DatabaseScreen` en modo `inline`. El slash de "Base de datos" crea la BD con
`isInline:true` e inserta el bloque (no navega). La paleta de comandos mantiene la
creación de BD a **página completa** (acción global, distinta del inline).

Sub-bloque 3: vistas **Calendario** (DB-025; rejilla mensual, agrupa por la primera
propiedad fecha, crea fila en un día, navega a la fila), **Cronograma/Gantt** (DB-026;
barras por fecha inicio/fin — usa la 1.ª propiedad fecha como inicio y la 2.ª como fin;
línea de "hoy") y **Panel de control** (`dashboard`; tarjetas de indicadores: total de
filas, suma de números, % de casillas, desglose por opciones de select). Pendiente:
filtros/orden/agrupación persistentes por vista (config), cálculos de pie de columna,
y vistas Gráfico/Mapa (no pedidas por el dueño).

## DEC-027 · 2026-10-19 · Tarjetas movibles (lienzo flotante de la página)

Funcionalidad pedida por el dueño (fuera de la spec): seleccionar contenido → "Agregar a
tarjeta" → una card gris editable que se mueve libremente por la página (como una ventana).
Modelo: columna `pages.cards` jsonb (migración `0008`): `[{ id, x, y, width, height,
content: Bloque[] }]`. UI: `CardLayer`/`CardPanel` (`src/components/editor/card-layer.tsx`)
renderiza una capa flotante absoluta sobre el documento; cada tarjeta tiene su propio
mini-editor BlockNote, barra de arrastre (pointer capture, imperativo para fluidez) y
redimensionado por la esquina. `PageBody` (`page-body.tsx`) mantiene el estado de las
tarjetas y las autoguarda (rebote 700 ms, `savePageCardsAction`), independiente del
autoguardado del contenido principal. Entradas: botón "Tarjeta" (card vacía) y un botón
"Agregar a tarjeta" en la barra de formato de BlockNote (mueve los bloques seleccionados a
una card nueva y los quita del documento). La ruta `[pageId]` usa `PageBody` con
`key={page.id}` para reiniciar el estado al cambiar de página.
