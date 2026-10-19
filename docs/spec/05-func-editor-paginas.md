<!-- Extraído de docs/Notion_Personal_Especificacion.docx (fuente de verdad). Líneas 1041-1151 del documento original. No editar a mano salvo que cambie la especificación. -->

7\. Catálogo completo de funcionalidades

Cada módulo lista sus funcionalidades con ID, detalle y prioridad. Las marcadas con ⚡ son mejoras "con esteroides" que no existen en Notion o que aquí se resuelven mejor.

7.1 Autenticación y seguridad (AU)

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| AU-001 | Setup inicial | Ruta /setup disponible solo si no existe ningún usuario: crea el usuario dueño (email = OWNER_EMAIL), el workspace y user_settings. Luego queda deshabilitada. | P0 |
| AU-002 | Login email + contraseña | Formulario en /login. Rate limit (5 intentos / 15 min por IP). Mensajes de error genéricos. | P0 |
| AU-003 | Registro bloqueado | Cualquier intento de registro con un email distinto a OWNER_EMAIL se rechaza en el servidor. | P0 |
| AU-004 | Middleware de protección | Todas las rutas excepto /login, /setup, /p/\*, /api/health, /api/cron/\* (con secreto) y /api/v1/\* (con token) exigen sesión. | P0 |
| AU-005 | Passkeys | Iniciar sesión con huella/Face ID/Windows Hello. | P1 |
| AU-006 | 2FA TOTP | Activable desde Ajustes con códigos de recuperación. | P1 |
| AU-007 | Sesiones | Ver dispositivos con sesión activa y cerrar sesión remota. | P1 |
| AU-008 | Bloqueo por inactividad ⚡ | PIN rápido opcional para desbloquear tras X minutos sin uso (útil en PCs compartidos). | P2 |
| AU-009 | Páginas cifradas ⚡ | Cifrado de extremo a extremo opcional por página con contraseña (AES-GCM en el navegador; el servidor solo guarda texto cifrado; no se indexa). | P2 |

7.2 Navegación, sidebar y layout (NV)

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| NV-001 | Sidebar con árbol de páginas | Árbol infinito de páginas anidadas con expandir/colapsar (estado recordado), icono y título. Carga perezosa de hijos. | P0 |
| NV-002 | Crear página desde sidebar | Botón "+" en raíz y en cada nodo (hover). Página nueva abre con foco en el título. | P0 |
| NV-003 | Arrastrar y soltar | Reordenar y mover páginas entre padres en el sidebar (dnd-kit) con indicador de inserción. También soltar en Favoritos. | P0 |
| NV-004 | Menú contextual de página | Clic derecho / "…": renombrar, duplicar, mover a, copiar enlace, abrir en nueva pestaña, favorito, archivar, eliminar. | P0 |
| NV-005 | Secciones del sidebar | Buscar, Hoy (nota diaria), Bandeja de entrada, Favoritos, Páginas, Plantillas, Papelera, Ajustes. | P0 |
| NV-006 | Sidebar redimensionable y colapsable | Ancho persistido. Atajo Ctrl/Cmd+\\ para colapsar. | P0 |
| NV-007 | Breadcrumbs | Ruta de la página en la barra superior; cada nivel navegable. | P0 |
| NV-008 | Atrás / adelante | Historial de navegación interno con atajos Alt+←/→. | P1 |
| NV-009 | Recientes | Lista de páginas visitadas recientemente en la paleta de comandos y la página de inicio. | P0 |
| NV-010 | Pestañas internas ⚡ | Abrir varias páginas en pestañas dentro de la app (Ctrl+clic), con reordenar y cerrar. | P2 |
| NV-011 | Vista dividida ⚡ | Dos páginas lado a lado (split view) para escribir con referencia. | P2 |
| NV-012 | Responsive | Sidebar como drawer en móvil; editor usable en pantallas de 360 px. | P0 |
| NV-013 | Página de inicio | Según start_page: última abierta, nota de hoy o una página fija. Dashboard opcional con recientes, favoritos y tareas de hoy. | P1 |

7.3 Páginas (PG)

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| PG-001 | Título editable | Título grande, Enter salta al primer bloque. Placeholder "Sin título". | P0 |
| PG-002 | Icono | Emoji (selector con búsqueda), icono de la librería (con color) o imagen subida. Opción "aleatorio". | P0 |
| PG-003 | Portada | Imagen subida, URL, degradados predefinidos o Unsplash. Reposicionar verticalmente arrastrando. | P1 |
| PG-004 | Subpáginas | Crear página hija desde el editor (bloque "Página") o desde el sidebar. | P0 |
| PG-005 | Opciones de estilo | Tipografía (default/serif/mono), texto pequeño, ancho completo. Por página. | P1 |
| PG-006 | Bloquear página | Evita ediciones accidentales; desbloqueo con un clic. | P1 |
| PG-007 | Duplicar | Duplica página con subpáginas (opción) y contenido; títulos con sufijo "(copia)". | P0 |
| PG-008 | Mover a | Diálogo con buscador para mover la página a otro padre o a una base de datos (convierte en fila). | P0 |
| PG-009 | Archivar / Papelera / Restaurar | Eliminar envía a Papelera (30 días). Restaurar devuelve a su padre original (o raíz si ya no existe). Vaciar papelera manual. | P0 |
| PG-010 | Historial de versiones | Panel con versiones por fecha; vista previa y diff visual (añadido/eliminado); restaurar crea una versión nueva (no destruye). | P1 |
| PG-011 | Versiones con nombre ⚡ | Guardar manualmente un snapshot con etiqueta. | P1 |
| PG-012 | Copiar enlace | Enlace interno /{pageId} y enlace a bloque /{pageId}#{blockId} con scroll y resaltado. | P0 |
| PG-013 | Índice flotante ⚡ | Tabla de contenidos lateral fija generada de los encabezados, con resaltado de sección actual. | P1 |
| PG-014 | Estadísticas de página ⚡ | Contador de palabras, caracteres, tiempo de lectura, fecha de creación y última edición. | P1 |
| PG-015 | Panel de backlinks | Al pie o en panel lateral: qué páginas mencionan esta, con fragmento de contexto. Incluye "menciones no enlazadas" (texto que coincide con el título) con botón para enlazar ⚡. | P1 |
| PG-016 | Convertir página ↔ base de datos | Convertir una página vacía en base de datos y viceversa (si no tiene filas). | P2 |
| PG-017 | Etiquetas transversales ⚡ | Asignar tags a cualquier página (no solo filas); filtrar y navegar por tags jerárquicos. | P2 |
| PG-018 | Modo enfoque ⚡ | Oculta sidebar y barras; solo el texto. Opcional: resaltar el párrafo actual (typewriter mode). | P1 |
| PG-019 | Actualizaciones / actividad | Panel con el log de actividad de la página (creada, movida, editada por automatización, etc.). | P2 |

7.4 Editor de bloques (ED)

Basado en BlockNote. Los bloques nativos se usan tal cual; los marcados como "custom" se implementan con la API de bloques personalizados de BlockNote (createReactBlockSpec).

| **ID** | **Funcionalidad** | **Detalle / criterio de aceptación** | **Prio.** |
|----|----|----|----|
| ED-001 | Párrafo / texto | Bloque base. Placeholder "Escribe '/' para comandos". | P0 |
| ED-002 | Encabezados H1–H3 | Atajos \#, \##, \###. Encabezados plegables (toggle heading) ⚡. | P0 |
| ED-003 | Listas | Viñetas (-), numeradas (1.), checklist (\[\]). Anidación con Tab / Shift+Tab. | P0 |
| ED-004 | Toggle | Bloque desplegable con hijos (\> + espacio). | P0 |
| ED-005 | Cita | Bloque de cita (" + espacio). | P0 |
| ED-006 | Callout (custom) | Caja con icono y color de fondo; contiene bloques hijos. | P0 |
| ED-007 | Divisor | --- inserta línea divisoria. | P0 |
| ED-008 | Código | Bloque de código con selector de lenguaje, resaltado Shiki, botón copiar, ajuste de línea, números de línea opcionales. | P0 |
| ED-009 | Tabla simple | Tabla nativa de BlockNote: añadir/eliminar filas y columnas, fila de encabezado. | P0 |
| ED-010 | Imagen | Subir (arrastrar, pegar, seleccionar), URL, redimensionar, alinear, pie de foto, ver a pantalla completa (lightbox). | P0 |
| ED-011 | Video / audio / archivo / PDF | Subida o URL. PDF con visor embebido; archivo con tarjeta de descarga. | P1 |
| ED-012 | Marcador web (custom) | Pegar URL → opción "Crear marcador": tarjeta con título, descripción, favicon e imagen OG (obtenidos en el servidor). | P1 |
| ED-013 | Embeds (custom) | YouTube, Vimeo, Google Maps, Figma, Loom, Spotify, CodePen, Google Drive, X/Twitter, tweets y genérico iframe con lista blanca. | P1 |
| ED-014 | Ecuación en bloque (custom) | LaTeX con KaTeX, vista previa en vivo. | P1 |
| ED-015 | Ecuación en línea | Contenido inline \$…\$ renderizado con KaTeX. | P1 |
| ED-016 | Columnas | Diseño en 2–5 columnas arrastrando bloques al costado (paquete multi-column de BlockNote). | P1 |
| ED-017 | Enlace a página (custom) | Bloque que enlaza a otra página existente (sin crearla como hija). | P0 |
| ED-018 | Mención de página (inline) | @ o \[\[ abre buscador de páginas; inserta enlace vivo (se actualiza si cambia el título). Opción "crear página nueva" desde el buscador. | P0 |
| ED-019 | Mención de fecha (inline) | @hoy, @mañana, @próximo lunes, @25 oct: inserta fecha relativa; opción de recordatorio (crea reminders). | P1 |
| ED-020 | Tabla de contenidos (custom) | Bloque que lista encabezados de la página con enlaces. | P1 |
| ED-021 | Breadcrumb (custom) | Bloque que muestra la ruta de la página. | P2 |
| ED-022 | Bloque sincronizado (custom) | Crear bloque sincronizado y pegar copias en otras páginas; editar en una actualiza todas. Indicador "Editando en N páginas". | P2 |
| ED-023 | Botón (custom) | Bloque botón que ejecuta acciones: insertar bloques de plantilla, crear página en BD, editar propiedades, abrir URL, disparar webhook. | P2 |
| ED-024 | Base de datos inline / vista enlazada (custom) | Insertar BD nueva inline o vista de una BD existente con su propia configuración de filtros. | P0 |
| ED-025 | Diagrama Mermaid (custom) ⚡ | Escribir Mermaid con vista previa en vivo (flujo, secuencia, gantt, ER, mindmap). | P1 |
| ED-026 | Pizarra Excalidraw (custom) ⚡ | Bloque de dibujo a mano alzada editable inline o a pantalla completa; se guarda como JSON + preview SVG. | P2 |
| ED-027 | Bloque de consulta ⚡ | Lista dinámica de páginas que cumplen un criterio (ej. "todas las páginas con tag \#idea editadas esta semana"). | P2 |
| ED-028 | Bloque flashcard ⚡ | Toggle marcado como tarjeta: el título es la pregunta, el contenido la respuesta. Se sincroniza con flashcards. | P2 |
| ED-029 | Bloque de progreso / checklist resumen ⚡ | Muestra % de checkboxes completados en la página. | P2 |
| ED-030 | Menú "/" | Comandos filtrables con fuzzy search, agrupados (Básicos, Medios, Bases de datos, Avanzados, IA), con atajos visibles y recientes primero. | P0 |
| ED-031 | Atajos Markdown | \*\*negrita\*\*, \*cursiva\*, \~~tachado\~~, \` código , \#, -, 1., \[\], \>, ", ---, \` \` \`\`. | P0 |
| ED-032 | Formato de texto | Barra flotante al seleccionar: negrita, cursiva, subrayado, tachado, código, enlace, color de texto y fondo (10 colores), ecuación, comentario, preguntar a IA. | P0 |
| ED-033 | Manija de bloque | Al pasar el cursor: "⋮⋮" para arrastrar; clic abre menú: eliminar, duplicar, convertir en, color, copiar enlace al bloque, comentar, mover a página. | P0 |
| ED-034 | Convertir en | Cambiar el tipo de cualquier bloque conservando contenido. Atajo Ctrl/Cmd+Alt+0…9. | P0 |
| ED-035 | Selección múltiple | Seleccionar varios bloques (arrastre o Shift+clic / Esc + flechas) y aplicar acciones en bloque. | P0 |
| ED-036 | Copiar / pegar inteligente | Pegar Markdown, HTML (desde web, Google Docs, Word) y texto plano convirtiendo a bloques. Pegar imagen sube el archivo. Pegar URL ofrece: enlace, marcador o embed. | P0 |
| ED-037 | Deshacer / rehacer | Ctrl/Cmd+Z / Shift+Z con historial por sesión de edición. | P0 |
| ED-038 | Buscar y reemplazar en página ⚡ | Ctrl/Cmd+F interno con resaltado, regex opcional y reemplazar todo. | P1 |
| ED-039 | Autoguardado | Ver sección 4.3. Indicador de estado y protección ante cierre con cambios pendientes. | P0 |
| ED-040 | Comentarios | Comentar texto seleccionado o bloques; hilos; resolver; panel lateral de comentarios abiertos. | P1 |
| ED-041 | Emojis | : + nombre abre selector inline de emojis. | P1 |
| ED-042 | Plantillas de bloques ⚡ | Guardar una selección de bloques como "snippet" reutilizable e insertarla con /snippet. | P2 |
| ED-043 | Contador de palabras en vivo | En la barra de estado (selección o total). | P1 |
| ED-044 | Corrector ortográfico | Usar el del navegador (spellcheck) con idioma configurable. | P0 |
