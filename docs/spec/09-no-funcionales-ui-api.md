<!-- Extraído de docs/Notion_Personal_Especificacion.docx (fuente de verdad). Líneas 1353-1454 del documento original. No editar a mano salvo que cambie la especificación. -->

8\. Requisitos no funcionales

8.1 Rendimiento

- Página con 500 bloques: carga inicial \< 1 s (BD despierta), escritura sin lag perceptible (\< 16 ms por tecla).

- Vista tabla con 5.000 filas: scroll fluido con virtualización; consulta inicial \< 500 ms.

- Sidebar con 2.000 páginas: carga perezosa por niveles.

- Bundle: carga diferida (next/dynamic) de Excalidraw, Mermaid, KaTeX, Recharts, mapa y editor de fórmulas.

- Cold start de Neon (plan gratuito, escala a cero): mostrar skeletons; no bloquear la UI. Precalentar con una consulta ligera al abrir la app.

8.2 Seguridad

- Verificar sesión en cada Server Action y Route Handler (no confiar solo en el middleware).

- Toda consulta filtra por workspace_id del usuario autenticado.

- Validación Zod en todas las entradas. Sanitizar HTML pegado y contenido publicado (DOMPurify en el render de páginas públicas).

- Embeds con lista blanca de dominios e iframes con sandbox.

- Cabeceras: CSP estricta, HSTS, X-Frame-Options DENY (excepto /p/\* si se permite embeber), Referrer-Policy.

- Tokens de API guardados solo como hash. Secretos únicamente en variables de entorno.

- Subidas: validar tipo MIME y tamaño (máx. 50 MB por archivo, configurable); nombres aleatorios en el bucket.

- Rate limiting en login, API pública, endpoints de IA y obtención de metadatos de URLs (prevenir SSRF: bloquear IPs privadas).

8.3 Fiabilidad y datos

- Concurrencia optimista con pages.version (4.3).

- Transacciones para operaciones multi-tabla (crear fila con ID único, mover páginas con hijos, guardar contenido + backlinks).

- Backups diarios (IO-008) + historial de Neon.

- Errores: boundary de React por sección, logging en servidor y notificación (toast) al usuario. Opcional: Sentry.

8.4 Jobs programados (Vercel Cron)

| **Endpoint** | **Frecuencia sugerida** | **Tarea** |
|----|----|----|
| /api/cron/reminders | Cada 5–15 min (según plan de Vercel) | Enviar recordatorios vencidos y reprogramar recurrentes. |
| /api/cron/recurring | Cada hora | Crear páginas de plantillas recurrentes. |
| /api/cron/automations | Cada 15 min | Disparadores programados y por fecha. |
| /api/cron/embeddings | Cada 30 min | Recalcular embeddings con embedding_stale = true (lotes). |
| /api/cron/backup | Diario 03:00 (hora Colombia) | Exportación total al storage. |
| /api/cron/cleanup | Diario | Purgar papelera \> 30 días, archivos huérfanos, versiones según retención, logs viejos. |

Si el plan de Vercel limita la frecuencia de los crons, usar un disparador externo (por ejemplo n8n o cron-job.org) que llame a los endpoints con CRON_SECRET.

8.5 Accesibilidad e internacionalización

- Navegable 100 % por teclado; roles ARIA (componentes Radix); contraste AA en ambos temas.

- Textos de UI en archivos de traducción (next-intl), español por defecto.

8.6 Testing

- **Unit (Vitest):** motores de fórmulas, filtros, ordenamiento, rollups, índice fraccionario, conversión de tipos de propiedad, parser de fechas en lenguaje natural, Markdown ↔ bloques.

- **Integración:** services contra una rama de Neon de test (o Postgres local en Docker).

- **E2E (Playwright):** login, crear página y escribir, menú "/", mover en sidebar, crear BD + vista tablero + filtros, búsqueda, papelera y restauración, publicar página.

- CI en GitHub Actions: lint, typecheck, unit, build en cada PR.

9\. Guía de interfaz

- **Layout:** sidebar izquierda (260 px), barra superior con breadcrumbs, estado de guardado, favoritos, compartir, comentarios, historial y menú "…"; contenido centrado (máx. 720 px, o completo con full_width).

- **Estética:** limpia y tipográfica, con identidad propia (no clonar los colores ni iconos de Notion). Fuente de UI Inter; serif opcional (Source Serif); mono JetBrains Mono.

- **Microinteracciones:** transiciones de 150 ms, skeletons en cargas, toasts con "Deshacer" tras eliminar/mover/archivar.

- **Estados vacíos:** cada vista y sección con estado vacío útil (acción principal + atajo).

- **Peek de filas:** panel lateral de 50 % del ancho redimensionable; Esc cierra; flechas ↑/↓ cambian de fila.

- **Móvil:** barra inferior con Buscar, Hoy, Nueva, Bandeja; editor con barra de herramientas sobre el teclado.

10\. API REST pública (resumen)

Base: /api/v1. Autenticación Authorization: Bearer ntp_xxx. Respuestas JSON; errores { error: { code, message } }. Paginación por cursor (?cursor=&limit=).

| **Método** | **Ruta** | **Descripción** |
|----|----|----|
| GET | /pages/:id | Obtener página (metadatos + propiedades). ?format=blocks\|markdown incluye contenido. |
| POST | /pages | Crear página (padre o base de datos, título, propiedades, contenido en bloques o Markdown). |
| PATCH | /pages/:id | Actualizar título, icono, propiedades, archivar. |
| DELETE | /pages/:id | Enviar a papelera. |
| POST | /pages/:id/blocks | Añadir bloques (o Markdown) al final o tras un bloque. |
| GET | /databases/:id | Esquema de la BD (propiedades, vistas). |
| POST | /databases/:id/query | Consultar filas con filtros y orden (mismo formato que vistas). |
| GET | /search?q= | Búsqueda full-text / híbrida. |
| POST | /capture | Captura rápida a la Bandeja (texto, URL). |
| POST | /files | Subir archivo y obtener file_id. |
