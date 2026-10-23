import '@/styles/globals.css'
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
