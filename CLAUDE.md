# Proyecto: Notion personal

Clon personal de Notion (un solo usuario): **Next.js · BlockNote · Postgres (Neon) · Drizzle · Vercel**.

**Fuente de verdad:** `docs/Notion_Personal_Especificacion.docx`, convertida y dividida en
`docs/spec/` (empezar por `docs/spec/00-indice.md`).
**Estado:** `docs/PROGRESS.md` · **Decisiones:** `docs/DECISIONS.md`.

## Índice de la especificación (`docs/spec/`)

- `00-indice.md` — resumen y qué contiene cada archivo.
- `01-reglas.md` — cómo usar el documento; reglas de trabajo.
- `02-vision-stack-arquitectura.md` — visión, stack, arquitectura (secciones 2–4).
- `03-configuracion.md` — Neon, BlockNote, variables de entorno, Vercel (sección 5).
- `04-base-de-datos.md` — esquema completo (sección 6): enums, tablas, índices.
- `05-func-editor-paginas.md` — funcionalidades AU, NV, PG, ED (7.1–7.4).
- `06-func-bases-de-datos.md` — bases de datos DB (7.5).
- `07-formulas.md` — motor de fórmulas FX (7.6).
- `08-func-resto.md` — SR, PR, AI, AT, IO, SH, SE, PW, atajos (7.7–7.15).
- `09-no-funcionales-ui-api.md` — requisitos no funcionales, UI, API REST (8–10).
- `10-roadmap.md` — roadmap por fases y prompt inicial (11–12).
- `11-licencias.md` — licencias, costes, riesgos, glosario (13–14).

## Comandos

```
npm run dev | build | start
npm run lint | typecheck | test | test:watch | test:e2e
npm run format | format:check
npm run db:generate | db:migrate | db:push | db:studio
```

## Convenciones

- TypeScript estricto, sin `any`. Server Components por defecto; `"use client"` solo donde haga falta.
- Mutaciones vía Server Actions en `src/server/actions`; lectura vía funciones en `src/server/queries`.
- Lógica de dominio reutilizable en `src/server/services`; motores puros en `src/lib/engines`.
- Validar toda entrada con **Zod**. Verificar sesión en TODA action/route (no confiar solo en el middleware).
- Toda consulta filtra por `workspace_id` del usuario autenticado.
- El esquema de la sección 6 es el **contrato**: todo cambio pasa por una migración de Drizzle (`npm run db:generate`) y se refleja en la especificación o en `DECISIONS.md`.
- No introducir dependencias nuevas sin justificarlo en `DECISIONS.md`.
- Toda la UI en **español** (i18n preparado para inglés en el futuro).
- No copiar marca, nombre, logotipo ni assets de Notion.
- Commits: `tipo(ID): descripción` → `feat(DB-004): vista tablero`. Trabajar **fase por fase** (roadmap, sección 11).
- Antes de cerrar una tarea: `lint` + `typecheck` + `test` + `build` deben pasar.

## Rama de trabajo

Se desarrolla en `develop`. `main`/`production` quedan para release y despliegue en Vercel.
