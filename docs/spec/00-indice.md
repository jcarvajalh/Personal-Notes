# Índice de la especificación — Notion personal

**Fuente de verdad:** `docs/Notion_Personal_Especificacion.docx`.
Esta carpeta (`docs/spec/`) contiene la conversión a Markdown (pandoc, GFM) dividida por
secciones para que Claude Code la lea de forma eficiente. Si cambia la especificación,
se vuelve a convertir el `.docx` y se re-divide; no editar estos archivos a mano.

> ESPECIFICACIÓN TÉCNICA Y FUNCIONAL — **Notion personal** *"con esteroides"*
> Workspace personal de notas, documentos y bases de datos.
> Stack: Next.js · BlockNote · Postgres (Neon) · Drizzle · Vercel.
> Autor: Juanca · Versión 1.0 · Octubre 2026.

## Qué contiene cada archivo

| Archivo | Secciones del original | Contenido |
|----|----|----|
| [01-reglas.md](01-reglas.md) | 1 | Cómo debe usar Claude Code este documento. Reglas de trabajo (fase por fase, IDs en commits, prioridades P0/P1/P2, PROGRESS.md, el esquema de BD es el contrato, lint/typecheck/test/build antes de cerrar, UI en español). Contenido sugerido de `CLAUDE.md`. |
| [02-vision-stack-arquitectura.md](02-vision-stack-arquitectura.md) | 2, 3, 4 | Visión y principios (single-user primero, velocidad percibida, keyboard-first). Qué queda fuera. Stack tecnológico completo (tabla). Arquitectura: capas del servidor, flujo de guardado del editor, consulta de bases de datos, estructura de carpetas (4.5). |
| [03-configuracion.md](03-configuracion.md) | 5 | Configuración inicial: comandos de Neon (5.1), BlockNote (5.2), variables de entorno (5.3), Vercel (5.4). |
| [04-base-de-datos.md](04-base-de-datos.md) | 6 (completa) | Decisiones de modelado, diagrama de entidades, enums (6.3), tablas de Better Auth (6.4), núcleo (6.5: workspaces, user_settings, pages, page_versions, page_visits), bases de datos (6.6), enlaces/bloques/auxiliares (6.7), productividad/automatización (6.8), config por tipo de propiedad (6.9), formato de valores (6.10), config de vistas (6.11). **Todas las columnas e índices.** |
| [05-func-editor-paginas.md](05-func-editor-paginas.md) | 7.1–7.4 | Funcionalidades: Autenticación y seguridad (AU), Navegación/sidebar/layout (NV), Páginas (PG), Editor de bloques (ED). |
| [06-func-bases-de-datos.md](06-func-bases-de-datos.md) | 7.5 | Funcionalidades de Bases de datos (DB): estructura/propiedades, vistas, consultar/manipular, relaciones avanzadas. |
| [07-formulas.md](07-formulas.md) | 7.6 | Motor de fórmulas (FX-001…009). |
| [08-func-resto.md](08-func-resto.md) | 7.7–7.15 | Búsqueda (SR), Productividad y conocimiento (PR), IA (AI), Automatizaciones e integraciones (AT), Import/Export/Backups (IO), Publicación (SH), Personalización y ajustes (SE), PWA y móvil (PW), Atajos de teclado (7.15). |
| [09-no-funcionales-ui-api.md](09-no-funcionales-ui-api.md) | 8, 9, 10 | Requisitos no funcionales (rendimiento, seguridad, fiabilidad, jobs cron 8.4, accesibilidad, testing), Guía de interfaz, API REST pública (resumen). |
| [10-roadmap.md](10-roadmap.md) | 11, 12 | Roadmap por fases (Fase 0 → 6 con criterios de aceptación) y el prompt inicial para Claude Code. |
| [11-licencias.md](11-licencias.md) | 13, 14 | Licencias, costes previstos, riesgos y mitigaciones. Glosario. |

## Mapa de fases (sección 11)

- **Fase 0 — Fundaciones:** Next.js + TS estricto + Tailwind + shadcn/ui + ESLint/Prettier/Husky; Neon + Drizzle + extensiones + esquema base (Better Auth, workspaces, user_settings, pages); AU-001…004; `/api/health`; despliegue en Vercel.
- **Fase 1 — Páginas y editor.**
- **Fase 2 — Bases de datos núcleo.**
- **Fase 3 — Bases de datos avanzadas.**
- **Fase 4 — Organización y pulido.**
- **Fase 5 — Productividad y PWA.**
- **Fase 6 — Esteroides (IA, automatizaciones, API, conocimiento).**

El estado por ID se mantiene en [../PROGRESS.md](../PROGRESS.md). Las decisiones de
implementación no cubiertas aquí se registran en [../DECISIONS.md](../DECISIONS.md).
