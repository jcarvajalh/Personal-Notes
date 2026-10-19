# Estado del proyecto (PROGRESS)

Estados: **pendiente** · **en curso** · **hecho** · **descartado**.
Prioridades: **P0** imprescindible (MVP) · **P1** siguiente iteración · **P2** mejora "con esteroides".
IDs y detalles en `docs/spec/05-func-editor-paginas.md`, `06-func-bases-de-datos.md`, `07-formulas.md` y `08-func-resto.md`.

> **Fase 0 — Fundaciones:** completada. AU-001…AU-004 hechas; `/api/health` operativo;
> proyecto Next.js + Drizzle + Neon + Better Auth. Ver `docs/DECISIONS.md`.

## 7.1 Autenticación y seguridad (AU)

| ID     | Funcionalidad            | Prio | Estado    |
| ------ | ------------------------ | ---- | --------- |
| AU-001 | Setup inicial            | P0   | hecho     |
| AU-002 | Login email + contraseña | P0   | hecho     |
| AU-003 | Registro bloqueado       | P0   | hecho     |
| AU-004 | Middleware de protección | P0   | hecho     |
| AU-005 | Passkeys                 | P1   | pendiente |
| AU-006 | 2FA TOTP                 | P1   | pendiente |
| AU-007 | Sesiones                 | P1   | pendiente |
| AU-008 | Bloqueo por inactividad  | P2   | pendiente |
| AU-009 | Páginas cifradas         | P2   | pendiente |

## 7.2 Navegación, sidebar y layout (NV)

| ID     | Funcionalidad                        | Prio | Estado    |
| ------ | ------------------------------------ | ---- | --------- |
| NV-001 | Sidebar con árbol de páginas         | P0   | pendiente |
| NV-002 | Crear página desde sidebar           | P0   | pendiente |
| NV-003 | Arrastrar y soltar                   | P0   | pendiente |
| NV-004 | Menú contextual de página            | P0   | pendiente |
| NV-005 | Secciones del sidebar                | P0   | pendiente |
| NV-006 | Sidebar redimensionable y colapsable | P0   | pendiente |
| NV-007 | Breadcrumbs                          | P0   | pendiente |
| NV-008 | Atrás / adelante                     | P1   | pendiente |
| NV-009 | Recientes                            | P0   | pendiente |
| NV-010 | Pestañas internas                    | P2   | pendiente |
| NV-011 | Vista dividida                       | P2   | pendiente |
| NV-012 | Responsive                           | P0   | pendiente |
| NV-013 | Página de inicio                     | P1   | pendiente |

## 7.3 Páginas (PG)

| ID     | Funcionalidad                    | Prio | Estado    |
| ------ | -------------------------------- | ---- | --------- |
| PG-001 | Título editable                  | P0   | pendiente |
| PG-002 | Icono                            | P0   | pendiente |
| PG-003 | Portada                          | P1   | pendiente |
| PG-004 | Subpáginas                       | P0   | pendiente |
| PG-005 | Opciones de estilo               | P1   | pendiente |
| PG-006 | Bloquear página                  | P1   | pendiente |
| PG-007 | Duplicar                         | P0   | pendiente |
| PG-008 | Mover a                          | P0   | pendiente |
| PG-009 | Archivar / Papelera / Restaurar  | P0   | pendiente |
| PG-010 | Historial de versiones           | P1   | pendiente |
| PG-011 | Versiones con nombre             | P1   | pendiente |
| PG-012 | Copiar enlace                    | P0   | pendiente |
| PG-013 | Índice flotante                  | P1   | pendiente |
| PG-014 | Estadísticas de página           | P1   | pendiente |
| PG-015 | Panel de backlinks               | P1   | pendiente |
| PG-016 | Convertir página ↔ base de datos | P2   | pendiente |
| PG-017 | Etiquetas transversales          | P2   | pendiente |
| PG-018 | Modo enfoque                     | P1   | pendiente |
| PG-019 | Actualizaciones / actividad      | P2   | pendiente |

## 7.4 Editor de bloques (ED)

| ID     | Funcionalidad                          | Prio | Estado    |
| ------ | -------------------------------------- | ---- | --------- |
| ED-001 | Párrafo / texto                        | P0   | pendiente |
| ED-002 | Encabezados H1–H3                      | P0   | pendiente |
| ED-003 | Listas                                 | P0   | pendiente |
| ED-004 | Toggle                                 | P0   | pendiente |
| ED-005 | Cita                                   | P0   | pendiente |
| ED-006 | Callout                                | P0   | pendiente |
| ED-007 | Divisor                                | P0   | pendiente |
| ED-008 | Código                                 | P0   | pendiente |
| ED-009 | Tabla simple                           | P0   | pendiente |
| ED-010 | Imagen                                 | P0   | pendiente |
| ED-011 | Video / audio / archivo / PDF          | P1   | pendiente |
| ED-012 | Marcador web                           | P1   | pendiente |
| ED-013 | Embeds                                 | P1   | pendiente |
| ED-014 | Ecuación en bloque                     | P1   | pendiente |
| ED-015 | Ecuación en línea                      | P1   | pendiente |
| ED-016 | Columnas                               | P1   | pendiente |
| ED-017 | Enlace a página                        | P0   | pendiente |
| ED-018 | Mención de página                      | P0   | pendiente |
| ED-019 | Mención de fecha                       | P1   | pendiente |
| ED-020 | Tabla de contenidos                    | P1   | pendiente |
| ED-021 | Breadcrumb                             | P2   | pendiente |
| ED-022 | Bloque sincronizado                    | P2   | pendiente |
| ED-023 | Botón                                  | P2   | pendiente |
| ED-024 | Base de datos inline / vista enlazada  | P0   | pendiente |
| ED-025 | Diagrama Mermaid                       | P1   | pendiente |
| ED-026 | Pizarra Excalidraw                     | P2   | pendiente |
| ED-027 | Bloque de consulta                     | P2   | pendiente |
| ED-028 | Bloque flashcard                       | P2   | pendiente |
| ED-029 | Bloque de progreso / checklist resumen | P2   | pendiente |
| ED-030 | Menú "/"                               | P0   | pendiente |
| ED-031 | Atajos Markdown                        | P0   | pendiente |
| ED-032 | Formato de texto                       | P0   | pendiente |
| ED-033 | Manija de bloque                       | P0   | pendiente |
| ED-034 | Convertir en                           | P0   | pendiente |
| ED-035 | Selección múltiple                     | P0   | pendiente |
| ED-036 | Copiar / pegar inteligente             | P0   | pendiente |
| ED-037 | Deshacer / rehacer                     | P0   | pendiente |
| ED-038 | Buscar y reemplazar en página          | P1   | pendiente |
| ED-039 | Autoguardado                           | P0   | pendiente |
| ED-040 | Comentarios                            | P1   | pendiente |
| ED-041 | Emojis                                 | P1   | pendiente |
| ED-042 | Plantillas de bloques                  | P2   | pendiente |
| ED-043 | Contador de palabras en vivo           | P1   | pendiente |
| ED-044 | Corrector ortográfico                  | P0   | pendiente |

## 7.5 Bases de datos (DB)

| ID     | Funcionalidad                               | Prio | Estado    |
| ------ | ------------------------------------------- | ---- | --------- |
| DB-001 | Crear base de datos                         | P0   | pendiente |
| DB-002 | Gestión de propiedades                      | P0   | pendiente |
| DB-003 | Tipos básicos                               | P0   | pendiente |
| DB-004 | Propiedades automáticas                     | P0   | pendiente |
| DB-005 | Relación                                    | P1   | pendiente |
| DB-006 | Rollup                                      | P1   | pendiente |
| DB-007 | Fórmula                                     | P1   | pendiente |
| DB-008 | Botón (propiedad)                           | P2   | pendiente |
| DB-009 | Valoración                                  | P1   | pendiente |
| DB-010 | Progreso                                    | P2   | pendiente |
| DB-011 | Ubicación                                   | P2   | pendiente |
| DB-012 | Propiedad IA                                | P2   | pendiente |
| DB-013 | Opciones de select                          | P0   | pendiente |
| DB-020 | Pestañas de vistas                          | P0   | pendiente |
| DB-021 | Vista Tabla                                 | P0   | pendiente |
| DB-022 | Vista Tablero (Kanban)                      | P0   | pendiente |
| DB-023 | Vista Lista                                 | P1   | pendiente |
| DB-024 | Vista Galería                               | P1   | pendiente |
| DB-025 | Vista Calendario                            | P1   | pendiente |
| DB-026 | Vista Línea de tiempo (Gantt)               | P2   | pendiente |
| DB-027 | Vista Gráfico                               | P2   | pendiente |
| DB-028 | Vista Mapa                                  | P2   | pendiente |
| DB-029 | Vista Feed                                  | P2   | pendiente |
| DB-040 | Filtros                                     | P0   | pendiente |
| DB-041 | Ordenar                                     | P0   | pendiente |
| DB-042 | Agrupar y subagrupar                        | P1   | pendiente |
| DB-043 | Cálculos                                    | P1   | pendiente |
| DB-044 | Búsqueda en BD                              | P0   | pendiente |
| DB-045 | Abrir fila                                  | P0   | pendiente |
| DB-046 | Plantillas de BD                            | P1   | pendiente |
| DB-047 | Edición en bloque                           | P1   | pendiente |
| DB-048 | Importar CSV                                | P1   | pendiente |
| DB-049 | Exportar CSV / Excel                        | P1   | pendiente |
| DB-050 | Bloqueo de BD                               | P2   | pendiente |
| DB-051 | Filtros por relación anidada                | P2   | pendiente |
| DB-052 | Filtros relativos al usuario/fecha dinámica | P0   | pendiente |
| DB-062 | Sub-elementos                               | P2   | pendiente |
| DB-063 | Dependencias                                | P2   | pendiente |
| DB-064 | Plantillas recurrentes                      | P1   | pendiente |

## 7.6 Motor de fórmulas (FX)

| ID     | Funcionalidad                  | Prio | Estado    |
| ------ | ------------------------------ | ---- | --------- |
| FX-001 | Sintaxis                       | P1   | pendiente |
| FX-002 | Funciones de texto             | P1   | pendiente |
| FX-003 | Funciones numéricas            | P1   | pendiente |
| FX-004 | Funciones de fecha             | P1   | pendiente |
| FX-005 | Funciones de listas            | P1   | pendiente |
| FX-006 | Relaciones en fórmulas         | P1   | pendiente |
| FX-007 | Inferencia y errores           | P1   | pendiente |
| FX-008 | Dependencias y cache           | P1   | pendiente |
| FX-009 | Fórmula desde lenguaje natural | P2   | pendiente |

## 7.7 Búsqueda (SR)

| ID     | Funcionalidad               | Prio | Estado    |
| ------ | --------------------------- | ---- | --------- |
| SR-001 | Paleta de comandos          | P0   | pendiente |
| SR-002 | Búsqueda full-text          | P0   | pendiente |
| SR-003 | Filtros de búsqueda         | P1   | pendiente |
| SR-004 | Búsqueda semántica          | P2   | pendiente |
| SR-005 | Búsqueda dentro de archivos | P2   | pendiente |
| SR-006 | Operadores                  | P2   | pendiente |

## 7.8 Productividad y conocimiento (PR)

| ID     | Funcionalidad                       | Prio | Estado    |
| ------ | ----------------------------------- | ---- | --------- |
| PR-001 | Notas diarias                       | P1   | pendiente |
| PR-002 | Bandeja de entrada / captura rápida | P1   | pendiente |
| PR-003 | Recordatorios y notificaciones push | P1   | pendiente |
| PR-004 | Vista "Hoy"                         | P2   | pendiente |
| PR-005 | Grafo de conocimiento               | P2   | pendiente |
| PR-006 | Repetición espaciada                | P2   | pendiente |
| PR-007 | Plantillas de workspace             | P1   | pendiente |
| PR-008 | Rastreador de hábitos               | P2   | pendiente |
| PR-009 | Temporizador / Pomodoro             | P2   | pendiente |
| PR-010 | Web clipper                         | P2   | pendiente |

## 7.9 Inteligencia artificial (AI)

| ID     | Funcionalidad               | Prio | Estado    |
| ------ | --------------------------- | ---- | --------- |
| AI-001 | Asistente en el editor      | P2   | pendiente |
| AI-002 | Snapshot antes de IA        | P2   | pendiente |
| AI-003 | Chat con el workspace (RAG) | P2   | pendiente |
| AI-004 | IA con herramientas         | P2   | pendiente |
| AI-005 | Generar base de datos       | P2   | pendiente |
| AI-006 | Autocompletar propiedades   | P2   | pendiente |
| AI-007 | Resumen de página           | P2   | pendiente |
| AI-008 | Generar fórmula             | P2   | pendiente |
| AI-009 | Prompts guardados           | P2   | pendiente |
| AI-010 | Control de gasto            | P2   | pendiente |

## 7.10 Automatizaciones e integraciones (AT)

| ID     | Funcionalidad            | Prio | Estado    |
| ------ | ------------------------ | ---- | --------- |
| AT-001 | Automatizaciones de BD   | P2   | pendiente |
| AT-002 | Historial de ejecuciones | P2   | pendiente |
| AT-003 | API REST personal        | P2   | pendiente |
| AT-004 | Webhooks salientes       | P2   | pendiente |
| AT-005 | Integración n8n          | P2   | pendiente |
| AT-006 | Webhook entrante         | P2   | pendiente |
| AT-007 | Atajos móviles           | P2   | pendiente |

## 7.11 Importación, exportación y backups (IO)

| ID     | Funcionalidad              | Prio | Estado    |
| ------ | -------------------------- | ---- | --------- |
| IO-001 | Exportar página a Markdown | P1   | pendiente |
| IO-002 | Exportar a PDF             | P1   | pendiente |
| IO-003 | Exportar a DOCX            | P2   | pendiente |
| IO-004 | Exportar a HTML            | P2   | pendiente |
| IO-005 | Exportación total          | P1   | pendiente |
| IO-006 | Importar Markdown          | P1   | pendiente |
| IO-007 | Importar desde Notion      | P1   | pendiente |
| IO-008 | Backups automáticos        | P1   | pendiente |
| IO-009 | Importar HTML / DOCX       | P2   | pendiente |

## 7.12 Publicación (SH)

| ID     | Funcionalidad             | Prio | Estado    |
| ------ | ------------------------- | ---- | --------- |
| SH-001 | Publicar en la web        | P2   | pendiente |
| SH-002 | Protección con contraseña | P2   | pendiente |
| SH-003 | Caducidad                 | P2   | pendiente |
| SH-004 | Estadísticas              | P2   | pendiente |
| SH-005 | Revocar                   | P2   | pendiente |

## 7.13 Personalización y ajustes (SE)

| ID     | Funcionalidad                      | Prio | Estado    |
| ------ | ---------------------------------- | ---- | --------- |
| SE-001 | Tema claro / oscuro / sistema      | P0   | pendiente |
| SE-002 | Color de acento                    | P1   | pendiente |
| SE-003 | Atajos personalizables             | P2   | pendiente |
| SE-004 | Preferencias regionales            | P1   | pendiente |
| SE-005 | Ajustes de notas diarias y bandeja | P1   | pendiente |
| SE-006 | Seguridad                          | P1   | pendiente |
| SE-007 | Datos                              | P1   | pendiente |
| SE-008 | IA                                 | P2   | pendiente |
| SE-009 | CSS personalizado                  | P2   | pendiente |

## 7.14 PWA y móvil (PW)

| ID     | Funcionalidad       | Prio | Estado    |
| ------ | ------------------- | ---- | --------- |
| PW-001 | Instalable          | P1   | pendiente |
| PW-002 | Notificaciones push | P1   | pendiente |
| PW-003 | Lectura offline     | P2   | pendiente |
| PW-004 | Edición offline     | P2   | pendiente |
| PW-005 | Share target        | P2   | pendiente |
| PW-006 | UI táctil           | P1   | pendiente |
