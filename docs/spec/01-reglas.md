<!-- Extraído de docs/Notion_Personal_Especificacion.docx (fuente de verdad). Líneas 19-70 del documento original. No editar a mano salvo que cambie la especificación. -->

1\. Cómo debe usar Claude Code este documento

Este documento es la **fuente de verdad** del proyecto. Claude Code debe leerlo completo antes de escribir código y volver a él al iniciar cada fase. Si una decisión de implementación no está cubierta aquí, debe elegir la opción más simple coherente con los principios de la sección 2 y documentarla en docs/DECISIONS.md.

1.1 Reglas de trabajo

1.  Trabajar **fase por fase** según la sección 11 (Roadmap). No empezar una fase sin cerrar los criterios de aceptación de la anterior.

2.  Cada funcionalidad tiene un **ID** (ej. ED-012). Usar ese ID en commits, ramas y comentarios: feat(ED-012): bloque toggle.

3.  Prioridades: **P0** = imprescindible para el MVP; **P1** = siguiente iteración; **P2** = mejora "con esteroides" posterior.

4.  Mantener un archivo docs/PROGRESS.md con la lista de IDs y su estado (pendiente / en curso / hecho / descartado).

5.  El esquema de base de datos de la sección 6 es el contrato. Todo cambio pasa por una migración de Drizzle (drizzle-kit generate) y se refleja en este documento o en DECISIONS.md.

6.  Antes de cerrar cualquier tarea: npm run lint, npm run typecheck, npm run test y npm run build deben pasar.

7.  No introducir dependencias nuevas sin justificarlo en DECISIONS.md. Preferir lo que ya está en el stack.

8.  Toda la UI en **español** (con i18n preparado para inglés en el futuro).

9.  No copiar marca, nombre, logotipo ni assets de Notion. Se replica la funcionalidad, no la identidad visual.

1.2 Archivo CLAUDE.md

En la raíz del repositorio debe existir un CLAUDE.md corto que apunte a este documento y resuma las convenciones. Contenido sugerido:

> \# Proyecto: Notion personal
>
> Especificación completa: docs/SPEC.docx (o docs/SPEC.md, versión convertida).
>
> Estado: docs/PROGRESS.md · Decisiones: docs/DECISIONS.md
>
> \## Comandos
>
> npm run dev \| build \| lint \| typecheck \| test \| test:e2e \| db:generate \| db:migrate \| db:studio
>
> \## Convenciones
>
> \- TypeScript estricto, sin any. Server Components por defecto; "use client" solo donde haga falta.
>
> \- Mutaciones vía Server Actions en src/server/actions; lectura vía funciones en src/server/queries.
>
> \- Validar toda entrada con Zod. Verificar sesión en TODA action/route (requireUser()).
>
> \- Commits: tipo(ID): descripción -\> feat(DB-004): vista tablero
>
> \- Al terminar una tarea: lint + typecheck + test + build deben pasar.
>
> **Sugerencia:** convierte este Word a Markdown (pandoc SPEC.docx -o docs/SPEC.md) y guárdalo en el repo. Claude Code lee Markdown de forma más eficiente que .docx.
