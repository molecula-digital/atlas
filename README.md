<div align="center">
  <img src=".github/preview.png" alt="Atlas Tech Preview" width="100%" />
  <h1>Atlas Tech</h1>
  <p><strong>Directorio del ecosistema tecnologico de Sinaloa</strong></p>

<a href="https://atlas-sinaloa.tech"><img src="https://img.shields.io/badge/🌐_sitio-atlas--sinaloa.tech-0969da?style=for-the-badge" alt="Sitio web" /></a>

<br />

<img src="https://img.shields.io/badge/next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
<img src="https://img.shields.io/badge/payload-3.x-000000?style=flat-square&logo=data:image/svg+xml;base64,PHN2Zy8+" alt="Payload CMS" />
<img src="https://img.shields.io/badge/react-19-61dafb?style=flat-square&logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/tailwind-4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
<img src="https://img.shields.io/badge/drizzle-orm-c5f74f?style=flat-square&logo=drizzle&logoColor=black" alt="Drizzle" />
<img src="https://img.shields.io/badge/postgresql-4169e1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
<img src="https://img.shields.io/github/license/ojoanalogo/atlas-tech?style=flat-square" alt="License" />

</div>

---

Plataforma web construida con Next.js y Payload CMS para gestionar el directorio de startups, empresas, comunidades y personas del ecosistema tech de Sinaloa.

Este repositorio cubre un solo estado por ahora, pero esta diseñado para que cualquier persona pueda hacer fork y crear el atlas de su propio estado.

## Stack

- **Next.js 15** — framework fullstack con App Router y React Server Components
- **Payload CMS 3** — CMS headless integrado en Next.js, panel de admin en `/admin`
- **React 19** + **Tailwind CSS 4** — UI con componentes cliente y utilidades CSS
- **Drizzle ORM** — esquemas de base de datos para auth y tablas custom (`src/db/schema/`)
- **PostgreSQL** — base de datos principal (Payload usa su propio adaptador, Drizzle maneja el esquema de auth)
- **better-auth** — autenticacion de usuarios con Google OAuth
- **S3** — almacenamiento de imagenes (Cloudflare R2 en produccion, MinIO local)

## Inicio rapido

```bash
pnpm install
cp .env.example .env      # configura tus variables
pnpm dev                   # servidor de desarrollo en localhost:3000
```

El panel de administracion de Payload esta disponible en `/admin`.

## Como funciona la publicacion de contenido

1. Un usuario inicia sesion con su cuenta de Google
2. Desde su dashboard, envia un registro a traves del formulario wizard seleccionando el tipo (startup, empresa, comunidad, etc.)
3. El registro se guarda como **borrador** en la base de datos via Payload
4. Un moderador revisa el registro desde el panel de admin (`/admin`) y lo publica o lo rechaza con una nota de retroalimentacion
5. Al publicarse, el contenido aparece automaticamente en el directorio publico

Las imagenes (logos, portadas) se suben a almacenamiento S3 compatible (Cloudflare R2 en produccion, MinIO en desarrollo local).

## Variables de entorno

Copia `.env.example` y configura segun tu entorno:

**Requeridas:**

| Variable | Descripcion | Como obtenerla |
|---|---|---|
| `DATABASE_URI` | Conexion a PostgreSQL | Local: `postgresql://user:pass@localhost:5432/db`. Produccion: [Neon](https://neon.tech), [Supabase](https://supabase.com), etc. |
| `PAYLOAD_SECRET` | Secret para Payload CMS | Genera con `openssl rand -hex 16` |
| `BETTER_AUTH_SECRET` | Secret para autenticacion | Genera con `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | URL publica del sitio | `http://localhost:3000` en desarrollo |
| `GOOGLE_CLIENT_ID` | ID de cliente OAuth de Google | Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/apis/credentials), configura la pantalla de consentimiento OAuth y crea credenciales tipo "ID de cliente de OAuth" para aplicacion web |
| `GOOGLE_CLIENT_SECRET` | Secret del cliente OAuth | Se genera junto con el Client ID en el paso anterior |

**Almacenamiento S3 (imagenes):**

| Variable | Descripcion |
|---|---|
| `S3_ENDPOINT` | URL del endpoint S3. Local: `http://localhost:9000` (MinIO). Produccion: `https://<account-id>.r2.cloudflarestorage.com` ([Cloudflare R2](https://developers.cloudflare.com/r2/)) |
| `S3_BUCKET` | Nombre del bucket |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Credenciales de acceso al bucket |
| `S3_REGION` | Region (`us-east-1` para MinIO, `auto` para R2) |
| `MEDIA_URL` | URL publica (CDN) donde se sirven las imagenes. Local: `http://localhost:9000/atlas-media`. Produccion: `https://cdn.atlas-sinaloa.tech` — no usar el endpoint R2 |

## Docker

El `Dockerfile` multi-stage construye la app en 3 fases:

1. **deps** — instala dependencias con `pnpm install --frozen-lockfile`
2. **builder** — genera el import map de Payload, ejecuta migraciones de base de datos y construye la app Next.js
3. **runner** — imagen minima de produccion con el output standalone de Next.js

```bash
docker build --build-arg DATABASE_URI="postgresql://..." -t atlas-tech .
docker run -p 3000:3000 --env-file .env atlas-tech
```

> La base de datos debe estar accesible durante el build para que las migraciones se ejecuten.

## Mapas

Los mapas geograficos utilizan archivos tipo **AGEM** (Area Geoestadistica Municipal) de INEGI:

https://www.inegi.org.mx/temas/mg/#mapas

Coloca el archivo descargado en `public/topo/`.

## Crea tu propio atlas

1. Haz fork de este repositorio
2. Configura tu base de datos PostgreSQL y variables de entorno
3. Crea credenciales OAuth en Google Cloud Console
4. Descarga los mapas AGEM de tu estado desde INEGI
5. Despliega con Docker o en cualquier plataforma compatible con Next.js
