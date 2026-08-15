import '@/styles/globals.css'
import Script from 'next/script'
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { PostHogIdentify } from '@/components/providers/PostHogIdentify'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MatrixBackground } from '@/components/layout/MatrixBackground'
import { HeroBackdrop } from '@/components/layout/HeroBackdrop'
import { SiteFrame } from '@/components/layout/SiteFrame'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

/**
 * Umami — cookieless pageview counts, alongside PostHog's product analytics.
 *
 * Configured the same way PostHog is: production only, and only when the
 * environment supplies an id. The id used to be hardcoded, which meant every
 * environment reported into the same Umami site and turning it off took a code
 * change. It is not a secret — Umami ids are public in the page source — this
 * is about being able to point it somewhere per environment.
 */
const UMAMI_SRC =
  process.env.NEXT_PUBLIC_UMAMI_SRC ||
  'https://analytics.molecula.digital/script.js'
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
const analyticsEnabled = process.env.NODE_ENV === 'production'

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es-MX"
      className={`${jetbrainsMono.variable} ${spaceGrotesk.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {analyticsEnabled && umamiWebsiteId && (
          // No `defer`: next/script injects this itself once the page is
          // interactive, and defer only means anything for a tag the HTML
          // parser inserted. Leaving it on read as though it controlled timing.
          <Script
            src={UMAMI_SRC}
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="bg-background">
        <ThemeProvider>
          <PostHogIdentify />
          <div className="font-sans w-full min-h-screen flex flex-col text-secondary selection:bg-accent selection:text-accent-foreground relative overflow-x-clip">
            <MatrixBackground highlight={false} />
            <HeroBackdrop />
            <div className="relative z-10 flex flex-col flex-1">
              <Header />
              {/*
                Page padding lives here, not on the pages. Horizontal gutters and
                max-width belong to SiteFrame; vertical padding was left to each
                page and drifted to four different values. Keeping it in one
                place is what stops that happening again — pages should not set
                their own py-* on the outermost element.
              */}
              <main id="main" className="flex-1 py-4">
                <SiteFrame>{children}</SiteFrame>
              </main>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
