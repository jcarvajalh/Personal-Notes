<!-- Extraído de docs/Notion_Personal_Especificacion.docx (fuente de verdad). Líneas 1152-1212 del documento original. No editar a mano salvo que cambie la especificación. -->

7.5 Bases de datos (DB)

Estructura y propiedades

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| DB-001 | Crear base de datos | Página completa o inline. Se crea con propiedad Title y una vista Tabla por defecto. | P0 |
| DB-002 | Gestión de propiedades | Añadir, renombrar, cambiar tipo (con conversión de valores), reordenar, ocultar, duplicar, eliminar (con confirmación) y descripción. | P0 |
| DB-003 | Tipos básicos | Title, Texto, Número (formatos y monedas COP/EUR/USD), Select, Multi-select, Status (grupos Por hacer/En curso/Hecho), Fecha (rango, hora, zona), Checkbox, URL, Email, Teléfono, Archivos. | P0 |
| DB-004 | Propiedades automáticas | Fecha de creación, Última edición, ID único (con prefijo). | P0 |
| DB-005 | Relación | Entre filas de la misma BD o de otra. Bidireccional opcional (crea propiedad inversa). Límite 1 o ilimitado. Selector con búsqueda y creación rápida de la fila destino. | P1 |
| DB-006 | Rollup | Agregar valores de una propiedad de las filas relacionadas con todas las funciones listadas en 6.9. Mostrar como número, barra o anillo. | P1 |
| DB-007 | Fórmula | Motor compatible con fórmulas de Notion 2.0 (ver 7.6). Editor con autocompletado, resaltado, vista previa en vivo del resultado y errores claros. | P1 |
| DB-008 | Botón (propiedad) | Botón por fila que ejecuta acciones (marcar hecho, mover fecha, crear página relacionada, webhook). | P2 |
| DB-009 | Valoración ⚡ | Estrellas / corazones / fuegos (1–5 o 1–10). | P1 |
| DB-010 | Progreso ⚡ | Barra o anillo; manual, o automático desde sub-elementos completados o checkboxes del contenido de la fila. | P2 |
| DB-011 | Ubicación ⚡ | Dirección con geocodificación (Nominatim / OpenStreetMap); alimenta la vista Mapa. | P2 |
| DB-012 | Propiedad IA ⚡ | Valor generado por Claude a partir del contenido de la fila y un prompt (resumen, categoría, sentimiento, traducción). Regenerar manual o automático al editar. | P2 |
| DB-013 | Opciones de select | Crear al escribir, colores, reordenar, renombrar (afecta todas las filas), fusionar opciones ⚡, eliminar. | P0 |

Vistas

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| DB-020 | Pestañas de vistas | Múltiples vistas por BD; crear, renombrar, duplicar, reordenar, eliminar, bloquear. Vista por defecto. | P0 |
| DB-021 | Vista Tabla | Celdas editables inline, redimensionar columnas, reordenar columnas arrastrando, ajustar texto, columnas fijas, número de fila, selección múltiple de filas con acciones en bloque, añadir fila al final y entre filas, navegación por teclado tipo hoja de cálculo (flechas, Enter, Tab), copiar/pegar rangos desde Excel/Sheets ⚡. | P0 |
| DB-022 | Vista Tablero (Kanban) | Agrupar por select/status/multi-select/relación/checkbox/fecha; arrastrar tarjetas entre columnas (actualiza la propiedad); reordenar columnas; ocultar/colapsar grupos; contador por columna; límite WIP con alerta ⚡. | P0 |
| DB-023 | Vista Lista | Lista minimalista con propiedades a la derecha. | P1 |
| DB-024 | Vista Galería | Tarjetas con portada (cover, primera imagen del contenido o propiedad archivo), tamaño S/M/L, ajustar imagen. | P1 |
| DB-025 | Vista Calendario | Mes/semana; filas por propiedad fecha; arrastrar para cambiar fecha; rangos multi-día; crear fila haciendo clic en un día; filas sin fecha en panel lateral ⚡. | P1 |
| DB-026 | Vista Línea de tiempo (Gantt) | Barras por rango de fechas, zoom (día/semana/mes/trimestre/año), arrastrar y redimensionar barras, tabla lateral, dependencias con flechas ⚡, línea de "hoy". | P2 |
| DB-027 | Vista Gráfico | Barras, líneas, área, donut. Eje X por propiedad, Y = conteo o agregado; apilar por propiedad; respeta filtros. | P2 |
| DB-028 | Vista Mapa ⚡ | Pines por propiedad ubicación (Leaflet + OpenStreetMap), clustering, abrir fila desde el pin. | P2 |
| DB-029 | Vista Feed | Filas como publicaciones con su contenido expandido (estilo blog/diario). | P2 |

Consultar y manipular

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| DB-040 | Filtros | Constructor visual con todos los operadores de 6.11, grupos AND/OR anidados, filtros rápidos en barra (chips). Por vista. | P0 |
| DB-041 | Ordenar | Múltiples criterios; arrastrar para priorizar. | P0 |
| DB-042 | Agrupar y subagrupar | En todas las vistas que aplique. Grupos colapsables, ocultar vacíos, orden manual. | P1 |
| DB-043 | Cálculos | Pie de columna y por grupo: contar, contar valores, únicos, vacíos, % vacíos, suma, promedio, mediana, mín, máx, rango, fechas más temprana/tardía, % marcados. | P1 |
| DB-044 | Búsqueda en BD | Campo de búsqueda en la barra de la vista (título + texto + propiedades de texto). | P0 |
| DB-045 | Abrir fila | Side peek (panel lateral), center peek (modal) o página completa. Propiedades arriba (ocultables cuando están vacías) y editor debajo. | P0 |
| DB-046 | Plantillas de BD | Plantillas de fila con propiedades y contenido predefinidos; plantilla por defecto; variables ({{hoy}}, {{ahora}}). Botón "Nuevo ▾" para elegir plantilla. | P1 |
| DB-047 | Edición en bloque | Seleccionar varias filas y: editar una propiedad, duplicar, mover a otra BD, eliminar. | P1 |
| DB-048 | Importar CSV | Asistente: mapear columnas a propiedades (con detección de tipos), vista previa, crear o anexar. | P1 |
| DB-049 | Exportar CSV / Excel ⚡ | Exportar la vista actual (respetando filtros) a CSV o XLSX. | P1 |
| DB-050 | Bloqueo de BD | Bloquear esquema de propiedades y vistas. | P2 |
| DB-051 | Filtros por relación anidada ⚡ | Filtrar filas según propiedades de sus filas relacionadas (ej. tareas cuyo proyecto está "Activo"). | P2 |
| DB-052 | Filtros relativos al usuario/fecha dinámica | "Hoy", "esta semana", "próximos N días" recalculados en cada carga. | P0 |

Relaciones avanzadas

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| DB-062 | Sub-elementos | Activar jerarquía padre/hijo dentro de la BD; tabla con filas anidadas expandibles; filtros que respetan jerarquía. | P2 |
| DB-063 | Dependencias | "Bloqueado por" / "Bloquea"; visibles en timeline; aviso al mover fechas que rompen dependencias ⚡. | P2 |
| DB-064 | Plantillas recurrentes | Crear filas automáticamente con plantilla según rrule (diario, semanal, cada 1.º de mes…). | P1 |
