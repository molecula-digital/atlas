import { buildConfig } from 'payload'
import { es } from '@payloadcms/translations/languages/es'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor, FixedToolbarFeature } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Media } from './src/collections/Media'
import { Users } from './src/collections/Users'
import { Entries } from './src/collections/Entries'
import { News } from './src/collections/News'
import { Jobs } from './src/collections/Jobs'
import { Events } from './src/collections/Events'
import { NewsletterSubscribers } from './src/collections/NewsletterSubscribers'
import { buildMediaFileUrl } from './src/lib/media-url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
  },
  i18n: {
    supportedLanguages: { es },
    fallbackLanguage: 'es',
  },
  collections: [Media, Users, Entries, News, Jobs, Events, NewsletterSubscribers],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    },
    schemaName: 'payload',
    push: false,
  }),
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
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
