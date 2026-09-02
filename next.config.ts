import { withSentryConfig } from '@sentry/nextjs'
import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const isCloudflareBuild = process.env.CLOUDFLARE_BUILD === '1'
const dirname = path.dirname(fileURLToPath(import.meta.url))
const emptyOg = path.join(dirname, 'stubs/empty-og.js')
const emptyModule = path.join(dirname, 'stubs/empty-module.js')

const cloudflareOgAliases = {
  'next/og': emptyOg,
  'next/dist/compiled/@vercel/og': emptyOg,
  'next/dist/compiled/@vercel/og/index.node.js': emptyOg,
  'next/dist/compiled/@vercel/og/index.edge.js': emptyOg,
}

const nextConfig: NextConfig = {
  // Inlined at build time so the Worker does not look up CLOUDFLARE_BUILD at runtime.
  env: {
    CLOUDFLARE_BUILD: isCloudflareBuild ? '1' : '',
  },
  // OpenNext on Workers cannot use `output: 'standalone'`. Docker still needs it.
  ...(isCloudflareBuild ? {} : { output: 'standalone' as const }),
  // Sharp loads libvips dynamically, which static output tracing cannot
  // discover. Include its platform package in the standalone runtime image.
  ...(isCloudflareBuild
    ? {}
    : {
        outputFileTracingIncludes: {
          '/*': ['./node_modules/@img/**/*'],
        },
      }),
  serverExternalPackages: ['pg', 'jose'],
  ...(isCloudflareBuild
    ? {
        turbopack: {
          resolveAlias: {
            'next/og': './stubs/empty-og.js',
            'next/dist/compiled/@vercel/og': './stubs/empty-og.js',
            'next/dist/compiled/@vercel/og/index.node.js':
              './stubs/empty-og.js',
            'next/dist/compiled/@vercel/og/index.edge.js':
              './stubs/empty-og.js',
            sharp: './stubs/empty-module.js',
            'drizzle-kit': './stubs/empty-module.js',
            'require-in-the-middle': './stubs/empty-module.js',
          },
        },
      }
    : {}),
  webpack: (config, { isServer }) => {
    if (isCloudflareBuild && isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        ...cloudflareOgAliases,
        sharp: emptyModule,
        'drizzle-kit': emptyModule,
        'require-in-the-middle': emptyModule,
      }
    }
    return config
  },
  images: {
    remotePatterns: [
      // Bucket objects are always served via the CDN custom domain.
      {
        protocol: 'https',
        hostname: 'cdn.atlas-sinaloa.tech',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      // Luma event covers synced into the calendar.
      {
        protocol: 'https',
        hostname: 'images.lumacdn.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.lu.ma',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
    ],
  },
}

const payloadConfig = withPayload(nextConfig)

const sentryOptions = {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'molecula-digital',

  project: 'atlas-tech',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayShadowDom: true,
    excludeReplayIframe: true,
    excludeReplayWorker: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js proxy, otherwise reporting of client-
  // side errors will fail.
  // Dev has no route to Sentry's ingest host, so the proxy only produces ETIMEDOUT noise.
  tunnelRoute:
    process.env.NODE_ENV === 'production' ? '/monitoring' : undefined,

  webpack: {
    // Sentry Cron Monitors — unused on Coolify; left for optional Sentry setup.
    // https://docs.sentry.io/product/crons/
    automaticVercelMonitors: true,
    // Node-only `require-in-the-middle` cannot resolve in the Workers middleware bundle.
    autoInstrumentMiddleware: false,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
}

// The Sentry Next.js webpack plugin injects Node `require-in-the-middle`
// into every server page. That module does not resolve under OpenNext/esbuild
// and inflates the Worker past the 10 MiB gzip cap. Browser Sentry still
// loads from `instrumentation-client.ts`.
export default isCloudflareBuild
  ? payloadConfig
  : withSentryConfig(payloadConfig, sentryOptions)

if (process.env.NODE_ENV === 'development') {
  void import('@opennextjs/cloudflare').then(
    ({ initOpenNextCloudflareForDev }) => initOpenNextCloudflareForDev(),
  )
}
