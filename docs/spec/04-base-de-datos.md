<!-- Extraído de docs/Notion_Personal_Especificacion.docx (fuente de verdad). Líneas 312-1040 del documento original. No editar a mano salvo que cambie la especificación. -->

6\. Arquitectura de la base de datos

6.1 Decisiones de modelado

- **Todo es una página.** Páginas normales, bases de datos (el contenedor), filas de base de datos y plantillas viven en la tabla pages, distinguidas por kind. Esto permite que cualquier fila tenga contenido de editor completo, se pueda mencionar, enlazar, mover y buscar igual que una página.

- **El contenido del editor se guarda como un documento JSONB por página** (pages.content, formato nativo de BlockNote: array de bloques). Es lo más simple y rápido para cargar/guardar. Lo que necesita consultarse a nivel de bloque (backlinks, menciones, bloques sincronizados, comentarios, recordatorios, tarjetas de estudio) se extrae al guardar a tablas auxiliares, referenciando el id del bloque de BlockNote.

- **Valores de propiedades en JSONB** (pages.properties, clave = database_properties.id). Excepción: las relaciones se guardan en relation_links para poder consultarlas en ambos sentidos.

- **Orden con índices fraccionarios** (position text, librería fractional-indexing): reordenar no exige actualizar filas vecinas.

- **Borrado suave**: archived_at (archivado) y deleted_at (papelera). Purga definitiva tras 30 días vía cron.

- **Identificadores**: uuid (v7 preferente, generados en la app) salvo en tablas de Better Auth, que usan sus propios ids text.

- **Timestamps**: siempre timestamptz, en UTC. La zona horaria del usuario está en user_settings.timezone.

- **Multi-tenant latente**: casi todas las tablas llevan workspace_id. Hoy existe un solo workspace.

6.2 Diagrama de entidades (resumen)

> user 1───1 user_settings user 1───N api_tokens / push_subscriptions
>
> user 1───N workspaces (hoy 1)
>
> workspace 1───N pages ──┐ parent_id (árbol de páginas, auto-referencia)
>
> ├─ database_id ──\> databases (filas pertenecen a una BD)
>
> databases 1───1 pages (página contenedora, kind=database)
>
> databases 1───N database_properties · database_views · automations
>
> pages N───N pages vía relation_links (por propiedad de relación)
>
> pages N───N pages vía backlinks (menciones / enlaces en contenido)
>
> pages N───N tags vía page_tags
>
> pages 1───N page_versions · comments · files · reminders · flashcards · share_links
>
> synced_blocks 1───N synced_block_refs ──\> pages
>
> automations 1───N automation_runs recurring_templates ──\> pages (plantilla)
>
> ai_conversations 1───N ai_messages

6.3 Tipos enumerados (Postgres enums)

| **Enum** | **Valores** |
|----|----|
| page_kind | page, database, row, template |
| page_font | default, serif, mono |
| property_type | title, text, number, select, multi_select, status, date, checkbox, url, email, phone, files, relation, rollup, formula, created_time, last_edited_time, unique_id, button, rating, progress, location, ai |
| view_type | table, board, list, gallery, calendar, timeline, chart, map, feed |
| backlink_kind | mention, link, embed, synced |
| version_reason | auto, manual, restore, before_ai, import |
| reminder_channel | push, email, both |
| automation_status | success, failed, skipped |
| activity_action | created, edited, renamed, moved, archived, restored, deleted, duplicated, published, unpublished, imported, ai_edit, automation |
| ai_role | user, assistant, system, tool |

6.4 Autenticación (Better Auth)

Better Auth crea y gestiona sus propias tablas. Se generan con su CLI (npx @better-auth/cli generate) en formato Drizzle y no se modifican a mano salvo para añadir columnas propias. Si se usa el Better Auth gestionado por Neon, respetar el esquema que este provisione.

Tabla user

Usuario dueño de la aplicación (uno solo).

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | text | PK | Id generado por Better Auth. |
| name | text | NOT NULL | Nombre visible. |
| email | text | NOT NULL, UNIQUE | Debe coincidir con OWNER_EMAIL. |
| email_verified | boolean | NOT NULL DEFAULT false |  |
| image | text | NULL | Avatar. |
| two_factor_enabled | boolean | DEFAULT false | Plugin 2FA. |
| created_at / updated_at | timestamptz | NOT NULL |  |

Tabla session

Sesiones activas (cookie httpOnly).

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | text | PK |  |
| user_id | text | FK → user.id ON DELETE CASCADE |  |
| token | text | UNIQUE |  |
| expires_at | timestamptz | NOT NULL |  |
| ip_address / user_agent | text | NULL | Para la lista de sesiones en Ajustes (SE-006). |
| created_at / updated_at | timestamptz | NOT NULL |  |

Además: account (credenciales/proveedores), verification (tokens de verificación), passkey y two_factor (plugins). Se usan tal como los genera Better Auth.

6.5 Núcleo

Tabla workspaces

Espacio de trabajo. Hoy existe uno, creado en el setup inicial.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| owner_id | text | FK → user.id, NOT NULL |  |
| name | text | NOT NULL | Ej. "Juanca". |
| icon | jsonb | NULL | Mismo formato que pages.icon. |
| created_at / updated_at | timestamptz | NOT NULL DEFAULT now() |  |

Tabla user_settings

Preferencias del usuario.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| user_id | text | PK, FK → user.id |  |
| theme | text | DEFAULT 'system' | light \| dark \| system. |
| accent_color | text | DEFAULT 'blue' |  |
| default_font | page_font | DEFAULT 'default' |  |
| locale | text | DEFAULT 'es-CO' | Formato de fechas y números. |
| timezone | text | DEFAULT 'America/Bogota' | IANA. |
| week_starts_on | smallint | DEFAULT 1 | 0 = domingo, 1 = lunes. |
| start_page | text | DEFAULT 'last' | last \| today \| page:\<uuid\>. |
| sidebar_width | integer | DEFAULT 260 |  |
| sidebar_collapsed | boolean | DEFAULT false |  |
| daily_notes_parent_id | uuid | FK → pages.id NULL | Dónde se crean las notas diarias. |
| daily_note_template_id | uuid | FK → pages.id NULL |  |
| inbox_page_id | uuid | FK → pages.id NULL | Destino de captura rápida. |
| shortcuts | jsonb | DEFAULT '{}' | Atajos personalizados: { accion: "mod+shift+x" }. |
| ai_settings | jsonb | DEFAULT '{}' | Modelo, tono, idioma, límite mensual de gasto. |
| updated_at | timestamptz | NOT NULL |  |

Tabla pages

Tabla central. Páginas, contenedores de bases de datos, filas y plantillas.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| workspace_id | uuid | FK → workspaces.id, NOT NULL |  |
| kind | page_kind | NOT NULL DEFAULT 'page' |  |
| parent_id | uuid | FK → pages.id NULL ON DELETE SET NULL | Página padre. NULL = raíz del workspace. Para filas: NULL (pertenecen a database_id). |
| database_id | uuid | FK → databases.id NULL ON DELETE CASCADE | Solo filas (kind=row) y plantillas de BD. |
| position | text | NOT NULL | Índice fraccionario entre hermanos. |
| title | text | NOT NULL DEFAULT '' | Título (también es la propiedad Title en filas). |
| icon | jsonb | NULL | { type: "emoji"\|"icon"\|"file", value, color? }. |
| cover | jsonb | NULL | { type: "file"\|"url"\|"gradient"\|"unsplash", value, position_y }. |
| content | jsonb | NOT NULL DEFAULT '\[\]' | Documento BlockNote (array de bloques). |
| content_text | text | NOT NULL DEFAULT '' | Texto plano extraído para búsqueda y embeddings. |
| properties | jsonb | NOT NULL DEFAULT '{}' | Valores de propiedades: { \[property_id\]: valor } (formatos en 6.10). |
| computed | jsonb | NOT NULL DEFAULT '{}' | Cache de fórmulas y rollups: { \[property_id\]: valor }. |
| search_vector | tsvector | GENERATED ALWAYS AS (…) STORED | setweight(to_tsvector('spanish', unaccent(title)),'A') \|\| setweight(to_tsvector('spanish', unaccent(content_text)),'B'). Requiere wrapper IMMUTABLE de unaccent. |
| embedding | vector(1024) | NULL | Embedding de título + contenido (dimensión según modelo de Voyage elegido). |
| embedding_stale | boolean | NOT NULL DEFAULT true | Cron recalcula los pendientes. |
| is_favorite | boolean | NOT NULL DEFAULT false |  |
| favorite_position | text | NULL | Orden dentro de Favoritos. |
| is_locked | boolean | NOT NULL DEFAULT false | Bloquea edición accidental. |
| full_width | boolean | NOT NULL DEFAULT false |  |
| small_text | boolean | NOT NULL DEFAULT false |  |
| font | page_font | NOT NULL DEFAULT 'default' |  |
| show_toc | boolean | NOT NULL DEFAULT false | Índice flotante lateral. |
| is_daily_note | boolean | NOT NULL DEFAULT false |  |
| daily_date | date | NULL, UNIQUE (workspace_id, daily_date) | Fecha de la nota diaria. |
| template_config | jsonb | NULL | Solo kind=template: { database_id?, is_default, variables }. |
| unique_number | integer | NULL | Número secuencial para propiedad ID único (filas). |
| word_count | integer | NOT NULL DEFAULT 0 |  |
| version | integer | NOT NULL DEFAULT 1 | Control de concurrencia optimista. |
| created_at | timestamptz | NOT NULL DEFAULT now() |  |
| updated_at | timestamptz | NOT NULL DEFAULT now() | Cualquier cambio (metadatos incluidos). |
| content_edited_at | timestamptz | NOT NULL DEFAULT now() | Última edición del contenido o propiedades (propiedad "Última edición"). |
| last_visited_at | timestamptz | NULL | Para "Recientes". |
| archived_at | timestamptz | NULL |  |
| deleted_at | timestamptz | NULL | En papelera. |

**Índices:**

- (workspace_id, parent_id, position) WHERE deleted_at IS NULL — árbol del sidebar.

- (database_id, position) WHERE deleted_at IS NULL — filas de una BD.

- GIN (properties jsonb_path_ops) — filtros de vistas.

- GIN (search_vector) — búsqueda full-text.

- GIN (title gin_trgm_ops) — búsqueda difusa por título / quick find.

- HNSW (embedding vector_cosine_ops) — búsqueda semántica.

- (workspace_id, last_visited_at DESC) — recientes. (workspace_id, is_favorite) parcial.

- (deleted_at) parcial WHERE deleted_at IS NOT NULL — purga de papelera.

- CHECK: kind = 'row' ⇒ database_id IS NOT NULL.

Tabla page_versions

Historial de versiones de una página (snapshots completos).

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| page_id | uuid | FK → pages.id ON DELETE CASCADE |  |
| version | integer | NOT NULL | pages.version en el momento del snapshot. |
| title | text | NOT NULL |  |
| icon / cover | jsonb | NULL |  |
| content | jsonb | NOT NULL |  |
| properties | jsonb | NOT NULL |  |
| reason | version_reason | NOT NULL DEFAULT 'auto' |  |
| label | text | NULL | Nombre opcional ("Antes de reestructurar"). |
| size_bytes | integer | NOT NULL |  |
| created_at | timestamptz | NOT NULL DEFAULT now() |  |

**Índices:**

- (page_id, created_at DESC).

- Retención: todas las manuales; automáticas de los últimos 90 días + 1 diaria hasta 1 año (cron).

Tabla page_visits

Registro ligero de visitas para "Recientes" y estadísticas.

| **Columna** | **Tipo**    | **Restricciones**               | **Descripción** |
|-------------|-------------|---------------------------------|-----------------|
| id          | bigserial   | PK                              |                 |
| page_id     | uuid        | FK → pages.id ON DELETE CASCADE |                 |
| visited_at  | timestamptz | NOT NULL DEFAULT now()          |                 |

**Índices:**

- (visited_at DESC). Retención 90 días.

6.6 Bases de datos

Tabla databases

Metadatos de una base de datos. Su página contenedora tiene kind = database.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| workspace_id | uuid | FK → workspaces.id |  |
| page_id | uuid | FK → pages.id UNIQUE ON DELETE CASCADE | Página contenedora (título, icono, posición en el árbol). |
| is_inline | boolean | NOT NULL DEFAULT false | Si se muestra embebida dentro de otra página. |
| title_property_id | uuid | FK → database_properties.id | Propiedad Title (siempre existe, no se borra). |
| default_view_id | uuid | FK → database_views.id NULL |  |
| row_open_mode | text | DEFAULT 'side_peek' | side_peek \| center_peek \| full_page. |
| unique_id_prefix | text | NULL | Ej. "TAR" → TAR-42. |
| next_unique_number | integer | NOT NULL DEFAULT 1 | Se incrementa en transacción al crear fila. |
| sub_items_property_id | uuid | NULL | Relación padre/hijo para sub-elementos (DB-062). |
| dependencies_property_id | uuid | NULL | Relación "bloqueado por" (DB-063). |
| description | text | NULL |  |
| created_at / updated_at | timestamptz | NOT NULL |  |

Tabla database_properties

Columnas (propiedades) de una base de datos.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK | Es la clave usada en pages.properties. |
| database_id | uuid | FK → databases.id ON DELETE CASCADE |  |
| name | text | NOT NULL, UNIQUE (database_id, name) |  |
| type | property_type | NOT NULL |  |
| config | jsonb | NOT NULL DEFAULT '{}' | Configuración por tipo (ver 6.9). |
| description | text | NULL | Tooltip. |
| position | text | NOT NULL | Orden por defecto. |
| created_at / updated_at | timestamptz | NOT NULL |  |

Tabla database_views

Vistas guardadas de una base de datos.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| database_id | uuid | FK → databases.id ON DELETE CASCADE |  |
| name | text | NOT NULL |  |
| type | view_type | NOT NULL |  |
| position | text | NOT NULL | Orden de pestañas. |
| host_page_id | uuid | FK → pages.id NULL | Si es una "vista enlazada" colocada en otra página, la página que la contiene. |
| host_block_id | text | NULL | Id del bloque BlockNote que embebe la vista. |
| config | jsonb | NOT NULL DEFAULT '{}' | Filtros, orden, agrupación, propiedades visibles, etc. (ver 6.11). |
| is_locked | boolean | NOT NULL DEFAULT false | Evita cambios accidentales de configuración. |
| created_at / updated_at | timestamptz | NOT NULL |  |

**Índices:**

- (database_id, position); (host_page_id).

Tabla relation_links

Valores de propiedades de relación (bidireccionales).

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| property_id | uuid | FK → database_properties.id ON DELETE CASCADE | Propiedad de relación en la BD origen. |
| source_page_id | uuid | FK → pages.id ON DELETE CASCADE | Fila origen. |
| target_page_id | uuid | FK → pages.id ON DELETE CASCADE | Fila destino. |
| position | text | NOT NULL | Orden dentro de la celda. |
| created_at | timestamptz | NOT NULL DEFAULT now() |  |

**Índices:**

- UNIQUE (property_id, source_page_id, target_page_id).

- (target_page_id, property_id) — lectura del lado inverso. La propiedad inversa se identifica por config.synced_property_id; no duplica filas.

6.7 Enlaces, bloques y contenido auxiliar

Tabla backlinks

Referencias entre páginas extraídas del contenido al guardar. Alimenta el panel de backlinks y el grafo.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| source_page_id | uuid | FK → pages.id ON DELETE CASCADE | Página que contiene la referencia. |
| source_block_id | text | NOT NULL | Id del bloque BlockNote. |
| target_page_id | uuid | FK → pages.id ON DELETE CASCADE |  |
| kind | backlink_kind | NOT NULL |  |
| context | text | NULL | Fragmento de texto alrededor (para mostrar en el panel). |
| created_at | timestamptz | NOT NULL DEFAULT now() |  |

**Índices:**

- UNIQUE (source_page_id, source_block_id, target_page_id, kind).

- (target_page_id).

- Al guardar una página: borrar sus backlinks y reinsertarlos en la misma transacción.

Tabla synced_blocks

Bloques sincronizados: un contenido que se muestra (y edita) en varias páginas.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| workspace_id | uuid | FK |  |
| content | jsonb | NOT NULL | Array de bloques BlockNote. |
| origin_page_id | uuid | FK → pages.id ON DELETE SET NULL | Página donde se creó. |
| version | integer | NOT NULL DEFAULT 1 |  |
| created_at / updated_at | timestamptz | NOT NULL |  |

Tabla synced_block_refs

Dónde aparece cada bloque sincronizado.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| synced_block_id | uuid | FK → synced_blocks.id ON DELETE CASCADE | PK compuesta. |
| page_id | uuid | FK → pages.id ON DELETE CASCADE | PK compuesta. |
| block_id | text | NOT NULL | PK compuesta. Id del bloque contenedor. |

Tabla tags

Etiquetas transversales del workspace (independientes de las bases de datos).

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| workspace_id | uuid | FK |  |
| name | text | NOT NULL, UNIQUE (workspace_id, name) | Permite jerarquía con "/": "trabajo/arka". |
| color | text | DEFAULT 'gray' |  |
| created_at | timestamptz | NOT NULL |  |

Tabla page_tags

Relación N:N entre páginas y etiquetas.

| **Columna** | **Tipo** | **Restricciones**               | **Descripción** |
|-------------|----------|---------------------------------|-----------------|
| page_id     | uuid     | FK → pages.id ON DELETE CASCADE | PK compuesta.   |
| tag_id      | uuid     | FK → tags.id ON DELETE CASCADE  | PK compuesta.   |

Tabla comments

Comentarios y notas al margen (para uno mismo: dudas, pendientes de revisión).

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| page_id | uuid | FK → pages.id ON DELETE CASCADE |  |
| block_id | text | NULL | NULL = comentario de página. |
| parent_id | uuid | FK → comments.id NULL ON DELETE CASCADE | Respuestas en hilo. |
| quoted_text | text | NULL | Texto seleccionado al comentar. |
| body | jsonb | NOT NULL | Contenido enriquecido (BlockNote reducido). |
| resolved_at | timestamptz | NULL |  |
| created_at / updated_at | timestamptz | NOT NULL |  |

**Índices:**

- (page_id, resolved_at).

Tabla files

Archivos subidos al object storage.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| workspace_id | uuid | FK |  |
| page_id | uuid | FK → pages.id NULL ON DELETE SET NULL | Página donde se usa. |
| storage_key | text | NOT NULL, UNIQUE | Ruta en el bucket. |
| url | text | NOT NULL | URL pública o base para firmar. |
| filename | text | NOT NULL |  |
| mime_type | text | NOT NULL |  |
| size_bytes | bigint | NOT NULL |  |
| width / height | integer | NULL | Imágenes. |
| blurhash | text | NULL | Placeholder mientras carga. |
| checksum | text | NULL | SHA-256 para deduplicar. |
| extracted_text | text | NULL | Texto de PDFs / OCR para búsqueda (P2). |
| created_at | timestamptz | NOT NULL |  |
| deleted_at | timestamptz | NULL | Se borra del storage tras 30 días. |

**Índices:**

- (page_id); (checksum).

Tabla share_links

Publicación de páginas en la web (solo lectura).

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| page_id | uuid | FK → pages.id ON DELETE CASCADE |  |
| slug | text | NOT NULL, UNIQUE | URL: /p/{slug}. |
| password_hash | text | NULL | Protección con contraseña (argon2). |
| expires_at | timestamptz | NULL | Enlace con caducidad. |
| include_subpages | boolean | NOT NULL DEFAULT false |  |
| allow_indexing | boolean | NOT NULL DEFAULT false | Si false: noindex. |
| view_count | integer | NOT NULL DEFAULT 0 |  |
| created_at | timestamptz | NOT NULL |  |
| revoked_at | timestamptz | NULL |  |

6.8 Productividad, automatización e integraciones

Tabla reminders

Recordatorios en bloques, propiedades de fecha o páginas.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| page_id | uuid | FK → pages.id ON DELETE CASCADE |  |
| block_id | text | NULL | Recordatorio dentro de un bloque (mención de fecha). |
| property_id | uuid | FK → database_properties.id NULL | Recordatorio sobre una propiedad fecha. |
| title | text | NOT NULL | Texto de la notificación. |
| remind_at | timestamptz | NOT NULL | Próxima ocurrencia. |
| rrule | text | NULL | Recurrencia RFC 5545. |
| channel | reminder_channel | NOT NULL DEFAULT 'push' |  |
| sent_at | timestamptz | NULL |  |
| snoozed_until | timestamptz | NULL |  |
| completed_at | timestamptz | NULL |  |
| created_at | timestamptz | NOT NULL |  |

**Índices:**

- (remind_at) WHERE sent_at IS NULL AND completed_at IS NULL.

Tabla push_subscriptions

Suscripciones Web Push por dispositivo.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| user_id | text | FK → user.id ON DELETE CASCADE |  |
| endpoint | text | NOT NULL, UNIQUE |  |
| p256dh / auth | text | NOT NULL | Claves de la suscripción. |
| device_name | text | NULL | Ej. "PC oficina", "Celular". |
| created_at / last_used_at | timestamptz |  |  |

Tabla automations

Reglas "cuando… entonces…" sobre bases de datos o globales.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| workspace_id | uuid | FK |  |
| database_id | uuid | FK → databases.id NULL ON DELETE CASCADE | NULL = automatización global (ej. programada). |
| name | text | NOT NULL |  |
| is_enabled | boolean | NOT NULL DEFAULT true |  |
| trigger | jsonb | NOT NULL | { type: "row_created"\|"property_changed"\|"schedule"\|"webhook"\|"button", config }. |
| conditions | jsonb | NOT NULL DEFAULT '\[\]' | Mismo formato que filtros de vista. |
| actions | jsonb | NOT NULL | Lista ordenada: set_property, create_page, add_relation, send_webhook, send_push, send_email, archive, ai_fill. |
| last_run_at | timestamptz | NULL |  |
| run_count | integer | NOT NULL DEFAULT 0 |  |
| created_at / updated_at | timestamptz | NOT NULL |  |

Tabla automation_runs

Historial de ejecuciones (depuración).

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| automation_id | uuid | FK → automations.id ON DELETE CASCADE |  |
| status | automation_status | NOT NULL |  |
| trigger_payload | jsonb | NULL |  |
| result | jsonb | NULL |  |
| error | text | NULL |  |
| started_at / finished_at | timestamptz |  |  |

**Índices:**

- (automation_id, started_at DESC). Retención 30 días.

Tabla recurring_templates

Creación periódica de páginas desde plantilla (ej. "Revisión semanal" cada domingo).

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| template_page_id | uuid | FK → pages.id ON DELETE CASCADE |  |
| target_database_id | uuid | FK → databases.id NULL | Destino BD, o… |
| target_parent_id | uuid | FK → pages.id NULL | …página padre. |
| title_pattern | text | NOT NULL | Ej. "Revisión semana {{week}} — {{date:YYYY-MM-DD}}". |
| rrule | text | NOT NULL |  |
| next_run_at | timestamptz | NOT NULL |  |
| last_run_at | timestamptz | NULL |  |
| is_enabled | boolean | NOT NULL DEFAULT true |  |

Tabla flashcards

Tarjetas de repetición espaciada generadas desde bloques (toggle = pregunta/respuesta).

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| page_id | uuid | FK → pages.id ON DELETE CASCADE |  |
| block_id | text | NOT NULL, UNIQUE (page_id, block_id) |  |
| front / back | text | NOT NULL | Extraídos del bloque. |
| ease | real | NOT NULL DEFAULT 2.5 | Algoritmo SM-2 (o FSRS). |
| interval_days | integer | NOT NULL DEFAULT 0 |  |
| repetitions | integer | NOT NULL DEFAULT 0 |  |
| due_at | timestamptz | NOT NULL DEFAULT now() |  |
| last_reviewed_at | timestamptz | NULL |  |
| suspended | boolean | NOT NULL DEFAULT false |  |

**Índices:**

- (due_at) WHERE suspended = false.

Tabla api_tokens

Tokens personales para la API REST (n8n, scripts, atajos del celular).

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| user_id | text | FK → user.id ON DELETE CASCADE |  |
| name | text | NOT NULL | Ej. "n8n". |
| token_hash | text | NOT NULL, UNIQUE | SHA-256 del token. El token solo se muestra una vez. |
| prefix | text | NOT NULL | Primeros caracteres visibles (ntp_ab12…). |
| scopes | text\[\] | NOT NULL DEFAULT '{read}' | read, write, admin. |
| last_used_at / expires_at / revoked_at | timestamptz | NULL |  |
| created_at | timestamptz | NOT NULL |  |

Tabla webhooks

Webhooks salientes por evento.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| workspace_id | uuid | FK |  |
| url | text | NOT NULL |  |
| events | text\[\] | NOT NULL | page.created, page.updated, row.created, row.property_changed, page.deleted… |
| database_id | uuid | FK NULL | Filtrar a una BD. |
| secret | text | NOT NULL | Firma HMAC-SHA256 en cabecera X-Signature. |
| is_enabled | boolean | NOT NULL DEFAULT true |  |
| last_status / last_called_at / failure_count | int / timestamptz / int |  | Se desactiva tras 10 fallos seguidos. |

Tabla activity_log

Registro de actividad (auditoría y vista "Actualizaciones").

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | bigserial | PK |  |
| workspace_id | uuid | FK |  |
| page_id | uuid | FK → pages.id ON DELETE CASCADE NULL |  |
| action | activity_action | NOT NULL |  |
| source | text | NOT NULL DEFAULT 'app' | app \| api \| automation \| ai \| cron. |
| details | jsonb | NULL | Ej. { from: "Ideas", to: "Proyectos" }. |
| created_at | timestamptz | NOT NULL DEFAULT now() |  |

**Índices:**

- (workspace_id, created_at DESC); (page_id, created_at DESC).

Tabla ai_conversations

Conversaciones con el asistente de IA.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| workspace_id | uuid | FK |  |
| page_id | uuid | FK → pages.id NULL | Contexto de página, si aplica. |
| title | text | NOT NULL |  |
| created_at / updated_at | timestamptz | NOT NULL |  |

Tabla ai_messages

Mensajes de una conversación de IA.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| conversation_id | uuid | FK → ai_conversations.id ON DELETE CASCADE |  |
| role | ai_role | NOT NULL |  |
| content | jsonb | NOT NULL | Partes del mensaje (texto, tool calls, citas a páginas). |
| model | text | NULL |  |
| input_tokens / output_tokens | integer | NULL | Control de gasto. |
| created_at | timestamptz | NOT NULL |  |

Tabla backups

Registro de copias de seguridad automáticas.

| **Columna** | **Tipo** | **Restricciones** | **Descripción** |
|----|----|----|----|
| id | uuid | PK |  |
| storage_key | text | NOT NULL | ZIP con JSON + Markdown + archivos. |
| size_bytes | bigint | NOT NULL |  |
| page_count | integer | NOT NULL |  |
| status | text | NOT NULL | running \| done \| failed. |
| created_at | timestamptz | NOT NULL |  |

6.9 Configuración por tipo de propiedad (\`database_properties.config\`)

| **Tipo** | **config (JSON)** |
|----|----|
| title / text | {} |
| number | { format: "number"\|"number_with_commas"\|"percent"\|"currency", currency?: "COP"\|"EUR"\|"USD"…, decimals?: 0-8, show_as?: "number"\|"bar"\|"ring", bar_max?: number } |
| select / multi_select | { options: \[{ id, name, color }\], sort: "manual"\|"alpha" } |
| status | { groups: \[{ id, name: "Por hacer"\|"En curso"\|"Hecho", color, option_ids: \[\] }\], options: \[{ id, name, color }\] } |
| date | { date_format: "relative"\|"DD/MM/YYYY"\|…, time_format: "24h"\|"12h", include_time: bool, is_range: bool } |
| checkbox / url / email / phone | {} |
| files | { accept?: \["image/\*"\], max?: number } |
| relation | { target_database_id, synced_property_id?: uuid (propiedad inversa en la BD destino), limit?: 1 \| null } |
| rollup | { relation_property_id, target_property_id, function: "count"\|"count_values"\|"count_unique"\|"count_empty"\|"count_not_empty"\|"percent_empty"\|"percent_not_empty"\|"sum"\|"average"\|"median"\|"min"\|"max"\|"range"\|"earliest_date"\|"latest_date"\|"date_range"\|"checked"\|"unchecked"\|"percent_checked"\|"show_original"\|"show_unique", show_as?: "number"\|"bar"\|"ring" } |
| formula | { expression: string, return_type (inferido): "text"\|"number"\|"boolean"\|"date"\|"list", format?: (igual que number/date) } |
| created_time / last_edited_time | { date_format, time_format } |
| unique_id | { prefix?: string } |
| button | { label, icon?, actions: \[igual que automations.actions\] } |
| rating | { max: 5\|10, icon: "star"\|"heart"\|"fire" } |
| progress | { source: "manual"\|"subitems"\|"checkboxes_in_page", show_as: "bar"\|"ring" } |
| location | { default_zoom?: number } |
| ai | { prompt: string, output: "text"\|"select"\|"number", target_options?: \[...\], auto_update: bool } |

6.10 Formato de valores (\`pages.properties\`)

| **Tipo** | **Valor almacenado** | **Ejemplo** |
|----|----|----|
| text | string (texto plano; rich text opcional como array de spans) | "Llamar a la clínica" |
| number | number \| null | 1250000 |
| select / status | option_id (string) \| null | "opt_3f2a" |
| multi_select | string\[\] (option ids) | \["opt_a","opt_b"\] |
| date | { start: ISO, end?: ISO, include_time: bool, tz?: string } | { "start":"2026-10-20", "include_time":false } |
| checkbox | boolean | true |
| url / email / phone | string | "https://arka.agency" |
| files | \[{ file_id?: uuid, url, name }\] | \[{"file_id":"…","name":"contrato.pdf"}\] |
| relation | NO se guarda aquí → relation_links | — |
| rollup / formula | NO se guarda aquí → pages.computed | — |
| created_time / last_edited_time / unique_id | Derivados de columnas de pages | — |
| rating | number (0..max) | 4 |
| progress (manual) | number 0..1 | 0.75 |
| location | { lat, lng, label } | { "lat":3.45, "lng":-76.53, "label":"Cali" } |
| ai | { value, generated_at, stale: bool } |  |

6.11 Configuración de vistas (\`database_views.config\`)

> {
>
> "filter": { // árbol AND/OR anidable (hasta 3 niveles)
>
> "op": "and",
>
> "rules": \[
>
> { "property_id": "…", "operator": "is", "value": "opt_x" },
>
> { "op": "or", "rules": \[ { "property_id": "…", "operator": "date_is_within", "value": "next_week" },
>
> { "property_id": "…", "operator": "is_empty" } \] }
>
> \]
>
> },
>
> "sorts": \[ { "property_id": "…", "direction": "asc" } \],
>
> "group_by": { "property_id": "…", "hide_empty": true, "order": \["opt_a","opt_b"\], "collapsed": \["opt_c"\] },
>
> "sub_group_by": null,
>
> "properties": \[ { "id": "…", "visible": true, "width": 220, "wrap": false } \], // orden + visibilidad
>
> "frozen_columns": 1,
>
> "calculations": { "\<property_id\>": "sum" }, // pie de tabla / por grupo
>
> "card": { "cover": "page_cover"\|"page_content"\|"property:\<id\>"\|"none", "size": "s"\|"m"\|"l", "fit": true },
>
> "calendar": { "date_property_id": "…", "show_weekends": true },
>
> "timeline": { "start_property_id": "…", "end_property_id": "…", "zoom": "week", "show_table": true },
>
> "chart": { "kind": "bar"\|"line"\|"donut"\|"area", "x": "\<property_id\>", "y": { "agg": "count"\|"sum", "property_id": "…" }, "stack_by": null },
>
> "map": { "location_property_id": "…" },
>
> "search": "", // filtro rápido persistente
>
> "page_size": 100, "show_row_numbers": false, "load_limit": 50
>
> }

**Operadores de filtro por tipo:** texto (is, is_not, contains, does_not_contain, starts_with, ends_with, is_empty, is_not_empty); número (=, ≠, \>, \<, ≥, ≤, between, is_empty); select/status (is, is_not, is_any_of, is_none_of, status_group_is); multi_select (contains, does_not_contain, contains_all); fecha (is, before, after, on_or_before, on_or_after, between, is_within: today/this_week/past_week/next_week/past_month/next_month/past_year/next_n_days/custom, is_relative: "hoy", "mañana", "hace 7 días"); checkbox (is checked/unchecked); relación (contains, does_not_contain, is_empty, contains_any_where — filtro por propiedades de la fila relacionada); fórmula/rollup (según tipo de retorno).
