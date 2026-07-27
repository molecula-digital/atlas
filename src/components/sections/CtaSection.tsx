import Link from 'next/link'
import { btn } from '@/components/ui/button-styles'

export function CtaSection() {
  return (
    <section className="py-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-card border border-border rounded-lg p-8 md:p-12 space-y-6">
          <h2 className="terminal-title text-2xl md:text-3xl font-sans font-bold text-primary uppercase">
            Pon a Sinaloa en el mapa
          </h2>
          <p className="text-secondary max-w-lg mx-auto">
            Ya seas una startup, consultoría, comunidad, empresa o profesional tech,
            si estás construyendo desde Sinaloa mereces ser visible. Únete al
            directorio y conecta con el ecosistema.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className={btn({ variant: 'accent', size: 'md' })}>
              Registrarme
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Link>
            <Link href="/directorio" className={btn({ size: 'md' })}>
              Explorar directorio
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
