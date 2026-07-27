import '@/styles/globals.css'
import Script from 'next/script'
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InfoBanner } from '@/components/layout/InfoBanner'
import { MatrixBackground } from '@/components/layout/MatrixBackground'

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

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${jetbrainsMono.variable} ${spaceGrotesk.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === 'production' && (
          <Script
            defer
            src="https://analytics.molecula.digital/script.js"
            data-website-id="87276dcc-091a-468d-a36f-4f1be4c4e1bc"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="bg-background">
        <ThemeProvider>
          <div className="font-sans w-full min-h-screen flex flex-col text-secondary selection:bg-accent selection:text-accent-foreground relative overflow-x-clip">
            <MatrixBackground boxSize={26} highlight={false} />
            <div className="relative z-10 flex flex-col flex-1">
              <InfoBanner />
              <Header />
              <main id="main" className="flex-1 md:px-6 lg:px-8">
                {children}
              </main>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
