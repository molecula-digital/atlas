import { buildConfig } from 'payload'
import { es } from '@payloadcms/translations/languages/es'
import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  lexicalEditor,
  FixedToolbarFeature,
} from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { fileURLToPath } from 'url'

import { Media } from './src/collections/Media'
import { Users } from './src/collections/Users'
import { Entries } from './src/collections/Entries'
import { News } from './src/collections/News'
import { Jobs } from './src/collections/Jobs'
import { Events } from './src/collections/Events'
import { LumaCalendars } from './src/collections/LumaCalendars'
import { NewsletterSubscribers } from './src/collections/NewsletterSubscribers'
import { buildMediaFileUrl } from './src/lib/media-url'
import { getPayloadPreviewUrl } from './src/lib/payload-preview'
import { lazyPostgresPoolOptions } from './src/lib/runtime'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const isProduction = process.env.NODE_ENV === 'production'
const isCloudflareBuild = process.env.CLOUDFLARE_BUILD === '1'
const sharp = isCloudflareBuild
  ? undefined
  : (await import('sharp')).default

export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    timezones: {
      defaultTimezone: 'America/Mazatlan',
    },
    components: {
      views: {
        dashboard: {
          Component: '/src/components/payload/Dashboard',
        },
      },
    },
    livePreview: {
      collections: ['entries', 'news', 'jobs', 'events'],
      url: ({ data, collectionConfig }) =>
        collectionConfig
          ? getPayloadPreviewUrl(collectionConfig.slug, data)
          : null,
      breakpoints: [
        { label: 'Móvil', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Escritorio', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  i18n: {
    supportedLanguages: { es },
    fallbackLanguage: 'es',
  },
  collections: [
    Media,
    Users,
    Entries,
    News,
    Jobs,
    Events,
    LumaCalendars,
    NewsletterSubscribers,
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  // Admin uses REST + server functions. GraphQL would pull `graphql` into the Worker.
  graphQL: { disable: true },
  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },
  db: postgresAdapter({
    pool: lazyPostgresPoolOptions(),
    schemaName: 'payload',
    push: false,
  }),
  logger: isProduction
    ? {
        options: { level: process.env.PAYLOAD_LOG_LEVEL || 'info' },
        // pino-pretty uses Node fs APIs that Workers do not implement.
        destination: { write: (msg: string) => console.log(msg) },
      }
    : undefined,
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
    ],
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
          // Always emit the public CDN (or local MinIO) URL — never the R2 API host.
          generateFileURL: ({ filename, prefix = '' }) =>
            buildMediaFileUrl(filename, prefix),
        },
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        endpoint: process.env.S3_ENDPOINT || '',
        region: process.env.S3_REGION || 'auto',
        forcePathStyle: true,
      },
    }),
  ],
})
