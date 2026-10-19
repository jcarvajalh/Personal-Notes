<!-- Extraído de docs/Notion_Personal_Especificacion.docx (fuente de verdad). Líneas 256-311 del documento original. No editar a mano salvo que cambie la especificación. -->

5\. Configuración inicial: Neon, BlockNote y Vercel

5.1 Neon (pasos indicados por Neon)

Ejecutar en la raíz del proyecto, una vez creado el proyecto Next.js:

> npx neon skills -y \# instala el agent-skill de Neon y seguir sus instrucciones
>
> npm i -g neon@latest \# si falla, usar: npx neon@latest en lugar de neon
>
> neon init -y --org-id org-old-dawn-72911020 --project-id plain-waterfall-53697106 \\
>
> --branch production --services postgres
>
> neon deploy \# provisiona servicios de neon.ts y escribe .env.local

- Si un comando abre el navegador para iniciar sesión, completar el login allí. Si falla o expira: neon login y reintentar.

- Conectar el servicio en el código usando las variables generadas. Elegir el driver según el skill de Neon (Vercel + funciones serverless).

- Activar extensiones en la primera migración: CREATE EXTENSION IF NOT EXISTS pg_trgm; y CREATE EXTENSION IF NOT EXISTS vector; y CREATE EXTENSION IF NOT EXISTS unaccent;.

- Prueba de humo obligatoria: npm run build pasa; endpoint /api/health hace SELECT 1 y devuelve la versión de Postgres.

- Crear una rama de Neon dev para desarrollo local; production solo para Vercel producción.

5.2 BlockNote

BlockNote es open source y se instala por npm; no requiere clave para el núcleo. La cuenta creada sirve para acceder a los paquetes XL / licencia y a sus servicios opcionales (IA, colaboración). Si el uso de un paquete XL requiere clave o token, guardarlo como variable de entorno, nunca en el código.

5.3 Variables de entorno

| **Variable** | **Uso** |
|----|----|
| DATABASE_URL | Conexión pooled a Neon (la genera neon deploy). |
| DATABASE_URL_UNPOOLED | Conexión directa para migraciones (si Neon la genera). |
| BETTER_AUTH_SECRET / BETTER_AUTH_URL | Auth (o las que genere el servicio gestionado de Neon). |
| OWNER_EMAIL | Único email autorizado a registrarse/iniciar sesión. |
| STORAGE\_\* | Credenciales del object storage elegido. |
| ANTHROPIC_API_KEY | Funciones de IA (Claude). |
| VOYAGE_API_KEY | Embeddings para búsqueda semántica. |
| VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY | Web Push. |
| RESEND_API_KEY | Emails de recordatorio (opcional). |
| CRON_SECRET | Protege los endpoints /api/cron/\*. |
| UNSPLASH_ACCESS_KEY | Galería de portadas (opcional). |

5.4 Vercel

- Importar el repo de GitHub en Vercel. Conectar la integración de Neon para inyectar variables por entorno.

- Previews: cada PR usa una rama de Neon propia (integración Neon–Vercel).

- Definir crons en vercel.json (ver sección 8.4). Verificar límites del plan de Vercel para la frecuencia de crons.

- Las migraciones se ejecutan en el build de producción (drizzle-kit migrate) o manualmente antes del deploy; nunca automáticamente en previews contra producción.
