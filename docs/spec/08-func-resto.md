<!-- Extraído de docs/Notion_Personal_Especificacion.docx (fuente de verdad). Líneas 1229-1352 del documento original. No editar a mano salvo que cambie la especificación. -->

7.7 Búsqueda (SR)

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| SR-001 | Paleta de comandos | Ctrl/Cmd+K: búsqueda de páginas (título difuso con pg_trgm), acciones (nueva página, ir a hoy, cambiar tema, abrir ajustes…), recientes. Navegable con teclado. | P0 |
| SR-002 | Búsqueda full-text | Sobre título y contenido con tsvector en español + unaccent; ranking por relevancia; fragmentos con resaltado (ts_headline). | P0 |
| SR-003 | Filtros de búsqueda | Por tipo (página/fila/BD), BD concreta, padre, fechas de creación/edición, tags, solo títulos. | P1 |
| SR-004 | Búsqueda semántica ⚡ | Embeddings con pgvector; resultados por significado ("ideas sobre captar clínicas") combinados con full-text (búsqueda híbrida, RRF). | P2 |
| SR-005 | Búsqueda dentro de archivos ⚡ | Indexar texto de PDFs subidos. | P2 |
| SR-006 | Operadores ⚡ | "frase exacta", -excluir, tag:idea, in:Proyectos, edited:7d. | P2 |

7.8 Productividad y conocimiento ⚡ (PR)

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| PR-001 | Notas diarias | Botón/atajo "Hoy" abre (o crea con plantilla) la nota del día dentro de la carpeta configurada. Navegar día anterior/siguiente. Mini calendario con días que tienen nota. | P1 |
| PR-002 | Bandeja de entrada / captura rápida | Atajo global en la app (Ctrl/Cmd+Shift+N) y en la PWA (share target) para capturar texto, enlaces o imágenes a la Bandeja. Procesar después: mover, convertir en tarea, archivar. | P1 |
| PR-003 | Recordatorios y notificaciones push | Recordatorios en fechas de bloques y propiedades; notificación Web Push en PC y celular (PWA instalada); posponer 10 min / 1 h / mañana; email opcional. | P1 |
| PR-004 | Vista "Hoy" | Agenda unificada: filas con fecha de hoy/vencidas de cualquier BD marcada como "de tareas", recordatorios y nota diaria. | P2 |
| PR-005 | Grafo de conocimiento | Visualización de nodos (páginas) y aristas (backlinks, relaciones, jerarquía) con filtros, zoom y grafo local de la página actual. | P2 |
| PR-006 | Repetición espaciada | Sesión de repaso /review con tarjetas vencidas (SM-2/FSRS), calificación Otra vez/Difícil/Bien/Fácil, estadísticas. | P2 |
| PR-007 | Plantillas de workspace | Galería propia de plantillas: Gestor de tareas, CRM de clientes (clínicas), Proyectos, Diario, Hábitos, Lecturas, Finanzas personales, Notas de reunión, Base de conocimiento. Instalables con un clic. | P1 |
| PR-008 | Rastreador de hábitos | Plantilla + vista calendario tipo "heatmap" con rachas. | P2 |
| PR-009 | Temporizador / Pomodoro | Widget en barra superior asociado opcionalmente a una fila (suma tiempo a una propiedad número). | P2 |
| PR-010 | Web clipper | Bookmarklet (y opcionalmente extensión) que guarda la página web actual como página (título, URL, contenido limpio con Readability) en la Bandeja. | P2 |

7.9 Inteligencia artificial ⚡ (AI)

> Requiere ANTHROPIC_API_KEY. El uso de la API de Claude tiene coste por tokens: incluir límite mensual configurable y medidor de gasto en Ajustes (AI-010).

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| AI-001 | Asistente en el editor | Espacio en línea vacía o selección + "Preguntar a IA": continuar escribiendo, resumir, mejorar redacción, corregir ortografía, cambiar tono, acortar/alargar, traducir, explicar, convertir en lista/tabla. Respuesta en streaming con Insertar / Reemplazar / Descartar. | P2 |
| AI-002 | Snapshot antes de IA | Toda edición aplicada por IA crea antes una versión before_ai. | P2 |
| AI-003 | Chat con el workspace (RAG) | Panel lateral: preguntar sobre todas las notas; búsqueda híbrida recupera páginas relevantes; respuestas con citas enlazadas a páginas/bloques. | P2 |
| AI-004 | IA con herramientas | El asistente puede crear páginas, añadir filas, editar propiedades y buscar (tool calling) con confirmación previa del usuario. | P2 |
| AI-005 | Generar base de datos | Describir una BD ("CRM para clínicas dentales en España") y la IA crea propiedades, opciones y vistas. | P2 |
| AI-006 | Autocompletar propiedades | Rellenar propiedades de filas a partir de su contenido (lote). | P2 |
| AI-007 | Resumen de página | Botón que genera TL;DR al inicio de la página. | P2 |
| AI-008 | Generar fórmula | Ver FX-009. | P2 |
| AI-009 | Prompts guardados | Crear y reutilizar prompts personalizados desde el menú IA. | P2 |
| AI-010 | Control de gasto | Registro de tokens por mensaje, total mensual y bloqueo al superar el límite. | P2 |

7.10 Automatizaciones e integraciones (AT)

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| AT-001 | Automatizaciones de BD | Disparadores: fila creada, propiedad cambia (a un valor), fecha alcanzada, programado (cron), webhook entrante, botón. Acciones: editar propiedades, crear página, añadir relación, notificación push, email, webhook saliente, archivar, rellenar con IA. Condiciones con el constructor de filtros. | P2 |
| AT-002 | Historial de ejecuciones | Ver runs con estado, payload y errores; reintentar. | P2 |
| AT-003 | API REST personal | /api/v1: páginas (CRUD, contenido como bloques o Markdown), bases de datos (consultar con filtros, crear/editar filas), búsqueda, append de bloques, subida de archivos. Autenticación Bearer con tokens de api_tokens. Documentación OpenAPI en /api/v1/docs. | P2 |
| AT-004 | Webhooks salientes | Suscripción a eventos con firma HMAC y reintentos exponenciales. | P2 |
| AT-005 | Integración n8n | Documentar ejemplos: crear fila desde formulario web, nota diaria con resumen del calendario, guardar emails importantes. Compatible con el nodo HTTP Request de n8n. | P2 |
| AT-006 | Webhook entrante | URL única por automatización para recibir datos externos y crear/editar filas. | P2 |
| AT-007 | Atajos móviles | Endpoint de captura rápida para Atajos de iOS / Tasker de Android. | P2 |

7.11 Importación, exportación y backups (IO)

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| IO-001 | Exportar página a Markdown | Con subpáginas opcional (ZIP con estructura de carpetas e imágenes). | P1 |
| IO-002 | Exportar a PDF | Exportador de BlockNote o impresión con hoja de estilos dedicada. | P1 |
| IO-003 | Exportar a DOCX | Exportador DOCX de BlockNote (paquete XL). | P2 |
| IO-004 | Exportar a HTML | Página estática autocontenida. | P2 |
| IO-005 | Exportación total | ZIP de todo el workspace: JSON completo (re-importable) + Markdown + CSV de BDs + archivos. | P1 |
| IO-006 | Importar Markdown | Archivos .md sueltos o carpeta ZIP (estilo Obsidian, con \[\[enlaces\]\] convertidos a menciones). | P1 |
| IO-007 | Importar desde Notion | Desde la exportación de Notion (ZIP Markdown + CSV): reconstruir jerarquía, páginas, BDs (CSV → propiedades) e imágenes. | P1 |
| IO-008 | Backups automáticos ⚡ | Cron diario genera exportación total en el object storage; retener 7 diarios + 4 semanales; restaurar desde Ajustes. Complementa el point-in-time restore de Neon. | P1 |
| IO-009 | Importar HTML / DOCX | Convertir documentos al formato de bloques. | P2 |

7.12 Publicación (SH)

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| SH-001 | Publicar en la web | Publicar una página en /p/{slug} de solo lectura (renderizado SSR, rápido, SEO opcional). Incluir subpáginas opcional. | P2 |
| SH-002 | Protección con contraseña ⚡ | Contraseña opcional por enlace. | P2 |
| SH-003 | Caducidad ⚡ | Enlaces que expiran en una fecha. | P2 |
| SH-004 | Estadísticas ⚡ | Contador de visitas por enlace. | P2 |
| SH-005 | Revocar | Despublicar al instante. | P2 |

7.13 Personalización y ajustes (SE)

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| SE-001 | Tema claro / oscuro / sistema | Cambio instantáneo sin parpadeo (script en \<head\>). | P0 |
| SE-002 | Color de acento | Paleta de acentos para la UI. | P1 |
| SE-003 | Atajos personalizables ⚡ | Lista de todos los atajos con editor y detección de conflictos. Hoja de atajos con ?. | P2 |
| SE-004 | Preferencias regionales | Idioma, zona horaria, formato de fecha/hora, primer día de la semana, moneda por defecto. | P1 |
| SE-005 | Ajustes de notas diarias y bandeja | Carpeta destino y plantilla. | P1 |
| SE-006 | Seguridad | Cambiar contraseña, passkeys, 2FA, sesiones activas, tokens de API. | P1 |
| SE-007 | Datos | Exportar, importar, backups, vaciar papelera, uso de almacenamiento. | P1 |
| SE-008 | IA | Modelo de Claude, idioma y tono por defecto, límite de gasto. | P2 |
| SE-009 | CSS personalizado ⚡ | Campo de CSS propio aplicado a toda la app. | P2 |

7.14 PWA y móvil (PW)

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| PW-001 | Instalable | Manifest, iconos, splash; instalable en Windows/Mac/Android/iOS desde el navegador. | P1 |
| PW-002 | Notificaciones push | Service worker para Web Push (ver PR-003). | P1 |
| PW-003 | Lectura offline | Cache de páginas visitadas recientemente (IndexedDB) para lectura sin conexión. | P2 |
| PW-004 | Edición offline | Cola de cambios en IndexedDB que se sincroniza al reconectar, con detección de conflictos por versión. | P2 |
| PW-005 | Share target | Compartir desde otras apps del celular hacia la Bandeja. | P2 |
| PW-006 | UI táctil | Gestos: deslizar para abrir sidebar, menú de bloque con pulsación larga, barra de formato sobre el teclado. | P1 |

7.15 Atajos de teclado (resumen mínimo)

| **Atajo** | **Acción** |
|----|----|
| Ctrl/Cmd + K | Paleta de comandos / búsqueda |
| Ctrl/Cmd + N | Nueva página |
| Ctrl/Cmd + Shift + N | Captura rápida a la Bandeja |
| Ctrl/Cmd + Shift + D | Abrir nota de hoy |
| Ctrl/Cmd + \\ | Mostrar/ocultar sidebar |
| Ctrl/Cmd + Shift + L | Cambiar tema |
| Ctrl/Cmd + P | Búsqueda rápida de páginas por título |
| Ctrl/Cmd + F | Buscar en la página |
| Ctrl/Cmd + Shift + F | Modo enfoque |
| Ctrl/Cmd + Alt + 0…9 | Convertir bloque (texto, H1–H3, checklist, viñeta, numerada, toggle, código, página) |
| Ctrl/Cmd + D | Duplicar bloque |
| Ctrl/Cmd + Shift + ↑/↓ | Mover bloque |
| Esc | Seleccionar bloque actual |
| Alt + ← / → | Atrás / adelante |
| ? | Hoja de atajos |
