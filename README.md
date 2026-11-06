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
<img src="https://img.shields.io/github/license/molecula-digital/atlas?style=flat-square" alt="License" />

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

| Variable               | Descripcion                                  | Como obtenerla                                                                                                                                                                                                     |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`         | Conexion PostgreSQL pooled para runtime      | Local: `postgresql://user:pass@localhost:5432/db`. En Neon usa el hostname con `-pooler`.                                                                                                                          |
| `DATABASE_DIRECT_URL`  | Conexion PostgreSQL directa para migraciones | Local puede ser la misma que `DATABASE_URL`. En Neon usa el hostname sin `-pooler`.                                                                                                                                |
| `PAYLOAD_SECRET`       | Secret para Payload CMS                      | Genera con `openssl rand -hex 16`                                                                                                                                                                                  |
| `BETTER_AUTH_SECRET`   | Secret para autenticacion                    | Genera con `openssl rand -base64 32`                                                                                                                                                                               |
| `NEXT_PUBLIC_SITE_URL` | URL publica del sitio                        | `http://localhost:3000` en desarrollo                                                                                                                                                                              |
| `GOOGLE_CLIENT_ID`     | ID de cliente OAuth de Google                | Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/apis/credentials), configura la pantalla de consentimiento OAuth y crea credenciales tipo "ID de cliente de OAuth" para aplicacion web |
| `GOOGLE_CLIENT_SECRET` | Secret del cliente OAuth                     | Se genera junto con el Client ID en el paso anterior                                                                                                                                                               |

**Almacenamiento S3 (imagenes):**

| Variable                                    | Descripcion                                                                                                                                                                       |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `S3_ENDPOINT`                               | URL del endpoint S3. Local: `http://localhost:9000` (MinIO). Produccion: `https://<account-id>.r2.cloudflarestorage.com` ([Cloudflare R2](https://developers.cloudflare.com/r2/)) |
| `S3_BUCKET`                                 | Nombre del bucket                                                                                                                                                                 |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Credenciales de acceso al bucket                                                                                                                                                  |
| `S3_REGION`                                 | Region (`us-east-1` para MinIO, `auto` para R2)                                                                                                                                   |
| `MEDIA_URL`                                 | URL publica (CDN) donde se sirven las imagenes. Local: `http://localhost:9000/atlas-media`. Produccion: `https://cdn.atlas-sinaloa.tech` — no usar el endpoint R2                 |

**Analytics:**

En produccion el layout carga [Umami](https://analytics.molecula.digital) desde `https://analytics.molecula.digital/script.js`. En `pnpm dev` el script no se incluye.

## Sincronizacion de calendarios Luma

Los eventos publicos de uno o mas calendarios de [Luma](https://luma.com) se pueden importar automaticamente a la coleccion **Eventos** de Payload.

1. En el admin (`/admin`), abre **Integraciones → Calendarios Luma**
2. La migracion siembra **Gina**, **La Cripto Plebada** y **Cursor Culiacan, Mexico**; agrega mas filas para otros calendarios
3. Configura `CRON_SECRET` (`openssl rand -hex 32`) en Infisical. El Worker lo usa en runtime.
4. El cron esta en `wrangler.jsonc` (`0 */12 * * *`, 5:00 AM y 5:00 PM hora de Mazatlan). Cloudflare lo registra al desplegar. `cloudflare/worker.mjs` llama a `POST /api/cron/luma-sync` dentro del propio Worker. Tambien puedes lanzarlo a mano:

```bash
curl -fsS -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  "https://atlas-sinaloa.tech/api/cron/luma-sync"
```

Tambien puedes forzar un calendario con `POST /api/luma-calendars/:id/sync` (sesion admin).

La sync corre en runtime contra la app desplegada (no en el build). Usa el feed publico de Luma; marca **Bloquear sync** en un evento para proteger ediciones manuales.

## Cloudflare Workers (produccion)

El sitio esta pensado para correr en [Cloudflare Workers](https://developers.cloudflare.com/workers/) con [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). No hace falta un VPS: Neon sigue siendo Postgres, R2 sigue siendo el bucket de imagenes, y el Worker sirve Next.js + Payload.

**Hace falta el plan Workers Paid.** El script del Worker (gzip) tiene que quedar **por debajo de 10 MiB**; el plan gratuito (3 MiB) no alcanza con Payload + Next. Los assets estaticos del cliente no cuentan en ese tope. `pnpm cf:deploy` corre `pnpm cf:check-size` y falla si Wrangler reporta gzip por encima de 10 MiB.

El build de Cloudflare usa **webpack** (`next build --webpack`) porque Turbopack duplica paquetes de Payload y infla el Worker. `@vercel/og` / wasm no se empaquetan: el OG del sitio es el JPG estatico `/og.jpg`. GraphQL de Payload esta desactivado; el admin usa REST.

### Por que el adaptador es tan raro

Workers no es Node. Next, Payload, `pg` y Sharp asumen procesos, addons nativos y `require` de Node. OpenNext empaqueta eso en un solo script. Cada archivo de abajo tapa un hueco que el paquete original no cubre. Quitar uno vuelve a romper el build o la primera visita.

| Archivo                                                               | Que tapa                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/run-build.mjs`                                               | Si `WORKERS_CI` o `CLOUDFLARE_BUILD` estan puestos, corre los parches de `cloudflare/` y luego OpenNext. Al terminar restaura Sharp y `pg-cloudflare` para que Docker siga usando los paquetes reales.                                                                                                    |
| `cloudflare/patch-sharp.mjs`                                          | Sharp es libvips nativo. El alias de webpack no llega al esbuild de OpenNext, asi que este script sustituye el paquete en disco por `cloudflare/stubs/empty-sharp.js` y `empty-sharp.cjs`.                                                                                                                |
| `cloudflare/assert-sharp.mjs`                                         | Falla el build si `worker.js` todavia trae el binario de Sharp.                                                                                                                                                                                                                                           |
| `cloudflare/patch-pg.mjs`                                             | `pg-cloudflare` exporta un modulo vacio por defecto y conecta con `import('cloudflare:sockets')`. Ese import dinamico lo resuelve el loader de Node y lanza `Cannot find module 'cloudflare:sockets'`. El script apunta el paquete al socket real y cambia la llamada a `globalThis.__cloudflareConnect`. |
| `cloudflare/assert-sockets.mjs`                                       | Falla el build si el bundle todavia tiene el import dinamico.                                                                                                                                                                                                                                             |
| `cloudflare/worker.mjs`                                               | Entry del Worker. OpenNext solo genera `fetch`. Este archivo importa `cloudflare:sockets` en estatico, lo guarda en `__cloudflareConnect`, y agrega el cron de Luma.                                                                                                                                      |
| `cloudflare/pin-name.mjs`                                             | Cloudflare Builds cambia el nombre del script al subirlo y no reescribe el service binding. Este script deja `name`, `WORKER_SELF_REFERENCE` y `main` en `atlas` / `cloudflare/worker.mjs`.                                                                                                               |
| `cloudflare/check-size.mjs`                                           | `pnpm cf:deploy` aborta si el gzip pasa de 10 MiB.                                                                                                                                                                                                                                                        |
| `package.json`                                                        | Dependencias directas `pg-cloudflare` y `require-in-the-middle`. Scripts `cf:build`, `cf:deploy`, `preview`. El paquete npm sigue llamandose `atlas-tech`. El Worker se llama `atlas`.                                                                                                                    |
| `cloudflare/stubs/empty-sharp.js`, `cloudflare/stubs/empty-sharp.cjs` | Reemplazo de Sharp. En el build de Next devuelve los bytes originales. En el request, `next/image` usa el binding `IMAGES`.                                                                                                                                                                               |
| `cloudflare/stubs/empty-og.js`                                        | `@vercel/og` compila WASM en runtime. Workers lo prohibe. El OG del sitio es `/og.jpg`.                                                                                                                                                                                                                   |
| `cloudflare/stubs/empty-module.js`                                    | Sustituto de `drizzle-kit` y `require-in-the-middle`. El segundo igual tiene que estar en `package.json`: el esbuild de OpenNext sigue resolviendo el `require()` que webpack no reescribio.                                                                                                              |
| `next.config.ts`                                                      | En el build de Workers aliasa Sharp, OG, `drizzle-kit` y `require-in-the-middle`, quita `output: 'standalone'` y no corre el plugin de Sentry (mete `require-in-the-middle` y se pasa del tope de 10 MiB).                                                                                                |
| `open-next.config.ts`                                                 | Fuerza `next build --webpack` mas el import map de Payload.                                                                                                                                                                                                                                               |
| `wrangler.jsonc`                                                      | Nombre `atlas`, cron, bindings `ASSETS`, `IMAGES` y `WORKER_SELF_REFERENCE`, y el alias de Sharp para el bundle final.                                                                                                                                                                                    |
| `src/lib/cloudflare-build-env.ts`                                     | Detecta `WORKERS_CI` / `CLOUDFLARE_BUILD`. `next.config.ts` deja `CLOUDFLARE_BUILD=1` grabado en el bundle.                                                                                                                                                                                               |
| `src/lib/runtime.ts`                                                  | En Workers el pool es `max: 4`, `maxUses: 1`. Payload se queda un cliente para siempre en `connectWithReconnect`. Con `max: 1` la siguiente query espera hasta el timeout.                                                                                                                                |
| `payload.config.ts`                                                   | No carga Sharp durante el build de Workers. Los tamanos `thumbnail` / `card` / `cover` no se generan ahi.                                                                                                                                                                                                 |
| `src/collections/Media.ts`                                            | `skipSafeFetch` en Workers. El fetch anti-SSRF de undici no corre en workerd.                                                                                                                                                                                                                             |
| `src/instrumentation.ts`                                              | No arranca el SDK de Sentry de Node en este build. Los errores del navegador siguen saliendo de `src/instrumentation-client.ts`. Los del Worker quedan en los logs de Cloudflare.                                                                                                                         |
| `src/lib/static-params.ts`                                            | Si Neon no responde durante el build de Workers, el build falla. En `pnpm dev` esa misma falla solo avisa.                                                                                                                                                                                                |
| `.gitignore`                                                          | Ignora `*.workers-stub-orig` y `*.workers-socket-orig`, las copias que los scripts de parche dejan al romper los hardlinks de pnpm.                                                                                                                                                                       |

`WORKER_SELF_REFERENCE` no es un parche nuestro. OpenNext lo usa para revalidar una pagina llamando al mismo Worker, sin salir a `https://atlas-sinaloa.tech`. El `service` tiene que ser `atlas`.

El binding `IMAGES` no es el bucket. Es [Image Resizing](https://developers.cloudflare.com/images/optimization/binding/) (`env.IMAGES`). OpenNext lo usa para `next/image`. Los originales siguen en R2 y salen por `cdn.atlas-sinaloa.tech`. Image Resizing tiene que estar activo en la cuenta y se cobra aparte.

El cron `0 */12 * * *` tambien esta en `wrangler.jsonc`. Es el Cron Trigger de Cloudflare (5:00 AM y 5:00 PM, hora de Mazatlan). `cloudflare/worker.mjs` llama a `/api/cron/luma-sync` con `CRON_SECRET` porque esa ruta tambien es publica.

### Primera vez

1. Instala dependencias y autentica Wrangler: `pnpm wrangler login`
2. Los secretos de la app viven en Infisical (`https://infisical.molecula.digital`, entorno `prod`). El build los lee con Universal Auth despues de pasar Cloudflare Access. En **Builds → Variables and secrets** tienen que estar `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`, `INFISICAL_CLIENT_ID` e `INFISICAL_CLIENT_SECRET`. `wrangler secret put` solo los deja en el Worker en ejecucion; el build no los ve.
3. `NEXT_PUBLIC_SITE_URL` se incrusta en el **build**. Si falta, el cliente usa `https://atlas-sinaloa.tech`. Una copia solo en los secretos del Worker no cambia el bundle.
4. Cloudflare Builds corre `pnpm run build`. Con `WORKERS_CI=1` ese script usa OpenNext + webpack. `pnpm cf:build` y `pnpm preview` fuerzan el mismo camino. Sin ese flag, Docker sigue generando el output `standalone`.
5. El build de Next sigue necesitando Postgres (para `generateStaticParams` y las paginas estaticas), mas `PAYLOAD_SECRET` y `BETTER_AUTH_SECRET`. Es el mismo requisito que el Dockerfile. `src/app/(payload)/admin/importMap.js` va en git (webpack en Cloudflare no lo encuentra si solo se genera en el clone); el build de Workers lo regenera antes de webpack.
6. Despliega conectando el repo en Cloudflare (Workers → Create → Connect git). El Worker del dashboard se llama **`atlas`** (el paquete npm sigue siendo `atlas-tech`). Comando de build: `pnpm cf:build` o `pnpm run build` (en Workers CI es lo mismo). Deploy: `pnpm cf:deploy` (no `npx wrangler deploy` a secas: hay que alinear `WORKER_SELF_REFERENCE` con el nombre del dashboard; si apunta a `atlas-tech` el upload falla con API 10143).

```bash
pnpm cf:build
pnpm cf:deploy
```

Si un deploy anterior dejo un service binding `WORKER_SELF_REFERENCE` → `atlas-tech` en el dashboard (Workers → Settings → Bindings), eliminalo. Ese Worker no existe.

7. Apunta `atlas-sinaloa.tech` al Worker (Workers → Settings → Domains & Routes). Actualiza las URLs de callback de Google OAuth si cambiaste de dominio.

Hyperdrive es opcional: descomenta el bloque en `wrangler.jsonc` despues de `wrangler hyperdrive create atlas-tech --connection-string="$DATABASE_URL"` para pool de conexiones y cache de queries. Sin el, Neon pooler + `maxUses: 1` es suficiente.

`pnpm dev` no cambia: sigue siendo Node.js contra Postgres y MinIO locales. `pnpm preview` construye el Worker y lo sirve con Wrangler para validar el runtime de Cloudflare.

## Docker (alternativa / self-host)

El `Dockerfile` multi-stage construye la app en 3 fases:

1. **deps** — instala dependencias con `pnpm install --frozen-lockfile`
2. **builder** — genera el import map de Payload, ejecuta migraciones de base de datos y construye la app Next.js
3. **runner** — imagen minima de produccion con el output standalone de Next.js

```bash
docker build \
  --build-arg DATABASE_DIRECT_URL="postgresql://..." \
  --build-arg SENTRY_AUTH_TOKEN="sntrys_..." \
  -t atlas-tech .

docker run -p 3000:3000 --env-file .env atlas-tech
```

> La base de datos debe estar accesible durante el build para que las migraciones se ejecuten.

> `SENTRY_AUTH_TOKEN` tambien es obligatorio durante el build. `withSentryConfig` lo usa para crear la release y subir source maps; si falta o la subida falla, el build falla y no produce una imagen desplegable.

> `NEXT_PUBLIC_SITE_URL` es la excepcion: **no** se pasa como `--build-arg`. Se queda fuera del build a proposito para que siga leyendose en tiempo de ejecucion desde `--env-file`, que es como llega hoy. Convertirla en build-arg la congelaria y romperia cualquier despliegue que no sea produccion.

## Mapas

Los mapas geograficos utilizan archivos tipo **AGEM** (Area Geoestadistica Municipal) de INEGI:

https://www.inegi.org.mx/temas/mg/#mapas

Coloca el archivo descargado en `public/topo/`.

## Crea tu propio atlas

1. Haz fork de este repositorio
2. Configura tu base de datos PostgreSQL y variables de entorno
3. Crea credenciales OAuth en Google Cloud Console
4. Descarga los mapas AGEM de tu estado desde INEGI
5. Despliega en Cloudflare Workers (`pnpm cf:deploy`) o con Docker
