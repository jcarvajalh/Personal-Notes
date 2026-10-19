<!-- Extraído de docs/Notion_Personal_Especificacion.docx (fuente de verdad). Líneas 1213-1228 del documento original. No editar a mano salvo que cambie la especificación. -->

7.6 Motor de fórmulas (FX)

Implementado como código puro en src/lib/engines/formula con tokenizer, parser (AST), inferencia de tipos y evaluador. Debe tener \> 90 % de cobertura de tests.

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| FX-001 | Sintaxis | Literales (número, texto, booleano), operadores + − \* / % ^, comparación == != \> \< \>= \<=, lógicos and/or/not, ternario if(), ifs(), let() y lets(), listas \[…\], acceso a propiedades prop("Nombre") y notación con punto prop("Fecha").formatDate("DD/MM"). | P1 |
| FX-002 | Funciones de texto | concat, join, length, contains, test (regex), match, replace, replaceAll, lower, upper, slice, split, trim, repeat, padStart, padEnd, link, style (negrita, colores), unstyle, format. | P1 |
| FX-003 | Funciones numéricas | abs, round, ceil, floor, sqrt, cbrt, exp, ln, log10, log2, pow, sign, min, max, sum, mean, median, mod, toNumber, formatNumber (moneda) ⚡. | P1 |
| FX-004 | Funciones de fecha | now, today, dateAdd, dateSubtract, dateBetween, dateRange, dateStart, dateEnd, formatDate, parseDate, year, month, week, day, date, hour, minute, timestamp, fromTimestamp, isWorkday ⚡, workdaysBetween ⚡ (con festivos de Colombia/España configurables). | P1 |
| FX-005 | Funciones de listas | at, first, last, sort, reverse, unique, includes, find, findIndex, filter, map, some, every, flat, slice, concat, count — con current e index. | P1 |
| FX-006 | Relaciones en fórmulas | Acceder a propiedades de filas relacionadas: prop("Tareas").filter(current.prop("Hecho")).length(). | P1 |
| FX-007 | Inferencia y errores | Tipo de retorno inferido; errores con posición y sugerencia ("¿Quisiste decir prop(\\"Fecha\\")?"). | P1 |
| FX-008 | Dependencias y cache | Grafo de dependencias entre propiedades; detección de ciclos; recálculo solo de lo afectado; cache en pages.computed. | P1 |
| FX-009 | Fórmula desde lenguaje natural ⚡ | Describir lo que se quiere ("días que faltan para la fecha límite, en rojo si es negativo") y la IA genera la fórmula. | P2 |
