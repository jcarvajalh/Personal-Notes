<!-- Extraído de docs/Notion_Personal_Especificacion.docx (fuente de verdad). Líneas 1455-1648 del documento original. No editar a mano salvo que cambie la especificación. -->

11\. Roadmap por fases

Cada fase termina con la app desplegada en Vercel y usable. Los IDs referencian la sección 7.

Fase 0 — Fundaciones (1–2 días)

**Objetivo:** Proyecto creado, desplegado y conectado a Neon con autenticación.

**Incluye:**

- Next.js + TypeScript estricto + Tailwind + shadcn/ui + ESLint/Prettier/Husky.

- Configuración de Neon (sección 5.1), Drizzle, extensiones, esquema base: Better Auth, workspaces, user_settings, pages.

- AU-001, AU-002, AU-003, AU-004. Endpoint /api/health.

- Despliegue en Vercel con integración Neon. CLAUDE.md, docs/PROGRESS.md, docs/DECISIONS.md.

**Criterios de aceptación:**

- npm run build pasa; login funciona en producción; /api/health responde con la versión de Postgres.

- Ningún otro email puede registrarse.

Fase 1 — Páginas y editor (MVP de escritura)

**Objetivo:** Poder usar la app a diario como cuaderno de notas.

**Incluye:**

- NV-001…007, NV-009, NV-012; PG-001, PG-002, PG-004, PG-007, PG-008, PG-009, PG-012.

- ED-001…010, ED-017, ED-018, ED-030…037, ED-039, ED-044.

- Autoguardado con versión optimista; subida de imágenes al storage (files).

- SR-001 (títulos), SR-002. SE-001.

**Criterios de aceptación:**

- Crear, anidar, mover (drag & drop), duplicar, eliminar y restaurar páginas.

- Escribir con todos los bloques P0, menciones y pegado inteligente; nada se pierde al recargar.

- Búsqueda encuentra texto del contenido con tildes o sin ellas.

- Tests E2E de los flujos anteriores en verde.

Fase 2 — Bases de datos núcleo

**Objetivo:** Gestionar tareas y proyectos como en Notion.

**Incluye:**

- Tablas databases, database_properties, database_views.

- DB-001…004, DB-013, DB-020, DB-021, DB-022, DB-040, DB-041, DB-044, DB-045, DB-052. ED-024.

**Criterios de aceptación:**

- Crear BD inline y de página completa, añadir propiedades de todos los tipos básicos.

- Tabla editable con teclado y tablero kanban con arrastre funcionan sobre 1.000 filas sin lag.

- Filtros AND/OR anidados y orden persistidos por vista.

Fase 3 — Bases de datos avanzadas

**Objetivo:** Relaciones, fórmulas y más vistas.

**Incluye:**

- relation_links; DB-005, DB-006, DB-007 y motor FX-001…008.

- DB-023, DB-024, DB-025, DB-042, DB-043, DB-046, DB-047, DB-048, DB-049, DB-064, DB-009.

**Criterios de aceptación:**

- Suite de tests del motor de fórmulas con \> 90 % de cobertura (incluye casos equivalentes a fórmulas reales de Notion).

- Relación bidireccional + rollup + fórmula funcionando en una plantilla "Proyectos ↔ Tareas".

Fase 4 — Organización y pulido

**Objetivo:** Paridad cómoda con Notion en el día a día.

**Incluye:**

- PG-003, PG-005, PG-006, PG-010, PG-011, PG-013, PG-014, PG-015, PG-018.

- ED-002 (toggle headings), ED-011…016, ED-019, ED-020, ED-025, ED-038, ED-040, ED-041, ED-043.

- NV-008, NV-013; SR-003; SE-002, SE-004…007; AU-005…007.

- IO-001, IO-002, IO-005, IO-006, IO-007, IO-008. PR-007.

**Criterios de aceptación:**

- Historial de versiones con restauración; backlinks; importación de una exportación real de Notion.

- Backup diario verificado y restaurable.

Fase 5 — Productividad y PWA

**Objetivo:** Que la app trabaje para ti, también en el celular.

**Incluye:**

- PW-001, PW-002, PW-006; PR-001, PR-002, PR-003; tablas reminders, push_subscriptions, recurring_templates.

- Crons de 8.4 (reminders, recurring, cleanup, backup).

**Criterios de aceptación:**

- Recordatorio programado llega como notificación push al celular con la PWA instalada.

- Nota diaria y captura rápida funcionan desde móvil.

Fase 6 — Esteroides

**Objetivo:** Lo que Notion no tiene.

**Incluye:**

- IA: AI-001…010, SR-004 (embeddings), DB-012, FX-009.

- Automatizaciones y API: AT-001…007, DB-008, ED-023, tablas automations, automation_runs, api_tokens, webhooks.

- Conocimiento: PR-004, PR-005, PR-006, ED-028, PG-017, ED-027.

- Vistas: DB-026, DB-027, DB-028, DB-029; DB-010, DB-011, DB-062, DB-063.

- Editor: ED-021, ED-022, ED-026, ED-029, ED-042. Publicación SH-001…005.

- Extras: NV-010, NV-011, PW-003, PW-004, PW-005, PR-008…010, SE-003, SE-008, SE-009, AU-008, AU-009, IO-003, IO-004, IO-009, SR-005, SR-006.

**Criterios de aceptación:**

- Cada funcionalidad se entrega de forma independiente con sus tests; el orden dentro de la fase lo decide el dueño del proyecto según uso real.

12\. Prompt inicial para Claude Code

Copiar y pegar en Claude Code, en una carpeta vacía, después de guardar este documento como docs/SPEC.md (o .docx):

> Lee completo docs/SPEC.md. Es la especificación y fuente de verdad de este proyecto:
>
> un clon personal de Notion (un solo usuario) con Next.js + BlockNote + Postgres en Neon
>
> \+ Drizzle, desplegado en Vercel.
>
> Vamos a ejecutar SOLO la Fase 0 (sección 11). Pasos:
>
> 1\. Crea el proyecto Next.js (App Router, TypeScript estricto, Tailwind, ESLint, src/),
>
> añade shadcn/ui, Prettier, Husky + lint-staged y la estructura de carpetas de la sección 4.5.
>
> 2\. Configura Neon siguiendo exactamente la sección 5.1:
>
> \- npx neon skills -y y sigue las instrucciones del skill de Neon.
>
> \- npm i -g neon@latest (si falla, usa npx neon@latest).
>
> \- neon init -y --org-id org-old-dawn-72911020 --project-id plain-waterfall-53697106
>
> --branch production --services postgres
>
> \- neon deploy
>
> Si algún comando abre el navegador para login, avísame para completarlo.
>
> Elige el driver según el skill de Neon para Vercel serverless.
>
> 3\. Configura Drizzle y crea las migraciones para: extensiones (pg_trgm, vector, unaccent),
>
> enums de la sección 6.3, tablas de Better Auth, workspaces, user_settings y pages
>
> EXACTAMENTE como en la sección 6 (columnas, tipos, restricciones e índices).
>
> 4\. Implementa AU-001 a AU-004 con Better Auth y el endpoint /api/health.
>
> 5\. Crea CLAUDE.md (sección 1.2), docs/PROGRESS.md con todos los IDs de la sección 7
>
> en estado "pendiente", y docs/DECISIONS.md.
>
> 6\. Demuestra que funciona: lint, typecheck y npm run build pasan; arranca la app,
>
> crea el usuario en /setup, inicia sesión y llama a /api/health.
>
> 7\. Repórtame qué cambió, la salida de los comandos que lo prueban y cualquier fallo.
>
> No avances a la Fase 1 hasta que yo lo confirme.

Para las fases siguientes, usar el mismo patrón: "Ejecuta la Fase N de docs/SPEC.md. Actualiza PROGRESS.md. Cumple los criterios de aceptación y demuéstralo."
