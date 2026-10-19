<!-- Extraído de docs/Notion_Personal_Especificacion.docx (fuente de verdad). Líneas 1649-1699 del documento original. No editar a mano salvo que cambie la especificación. -->

13\. Licencias, costes y riesgos

13.1 Licencias

- **BlockNote núcleo:** MPL-2.0, uso libre.

- **Paquetes XL de BlockNote** (multi-column, exportadores, IA): GPL-3.0 o licencia comercial. Para una app personal no distribuida es aceptable; si algún día se vende como producto cerrado, revisar licencia.

- **Excalidraw, Mermaid, KaTeX, Shiki, Leaflet:** licencias permisivas (MIT/BSD).

- **Marca:** no usar el nombre "Notion", su logo ni assets. Elegir un nombre propio para la app.

13.2 Costes previstos

| **Servicio** | **Plan** | **Coste** |
|----|----|----|
| Vercel | Hobby | Gratis (revisar límites de crons y funciones). |
| Neon | Free | Gratis: 1 GB de almacenamiento por proyecto, escala a cero. |
| Object storage | Neon 5 GB / Vercel Blob / R2 | Gratis en el rango de uso personal. |
| Claude API | Pago por uso | Variable; controlado con el límite de AI-010. |
| Voyage (embeddings) | Pago por uso / free tier | Bajo para volumen personal. |
| Resend (email) | Free | Gratis en volumen personal. |

13.3 Riesgos y mitigaciones

| **Riesgo** | **Mitigación** |
|----|----|
| Cold starts de Neon en plan gratuito | Skeletons, precalentamiento, cache local en IndexedDB. |
| Pérdida de datos por conflicto entre pestañas/dispositivos | Versión optimista + snapshots + backups diarios. |
| Complejidad del motor de fórmulas | Código puro, tests exhaustivos, entregar en Fase 3 de forma incremental. |
| Límites del editor BlockNote para bloques avanzados | Bloques custom con su API; si algo no es viable, documentar alternativa en DECISIONS.md. |
| Crecimiento del alcance | Respetar prioridades P0 → P1 → P2 y el roadmap. |
| Límites de crons en Vercel Hobby | Disparador externo (n8n / cron-job.org) con CRON_SECRET. |

14\. Glosario

| **Término** | **Significado** |
|----|----|
| Bloque | Unidad del editor (párrafo, encabezado, imagen…). Tiene id, tipo, props, contenido e hijos. |
| Página | Registro de pages. Puede contener bloques, subpáginas y bases de datos. |
| Base de datos | Colección de filas con propiedades tipadas y vistas. |
| Fila | Página que pertenece a una base de datos (kind = row). |
| Propiedad | Columna tipada de una base de datos. |
| Vista | Forma guardada de ver una BD (tabla, tablero…) con filtros/orden/agrupación propios. |
| Vista enlazada | Vista de una BD existente colocada dentro de otra página. |
| Rollup | Agregación de valores de filas relacionadas. |
| Backlink | Referencia entrante: otra página que enlaza o menciona a la actual. |
| Side peek | Panel lateral para abrir una fila sin salir de la vista. |
| Índice fraccionario | Cadena ordenable que permite insertar entre dos elementos sin renumerar. |
| RAG | Generación aumentada por recuperación: la IA responde usando tus páginas como contexto. |
