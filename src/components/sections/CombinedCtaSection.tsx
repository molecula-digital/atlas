import Link from 'next/link'
import { Plus, CreditCard, ArrowRight } from 'lucide-react'
import { btn } from '@/components/ui/button-styles'
import { SectionTitle } from '@/components/ui/SectionTitle'

export function CombinedCtaSection() {
  return (
    <section className="py-4 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <SectionTitle
          align="center"
          className="mb-8"
          titleClassName="uppercase"
          description="Únete al ecosistema tech de Sinaloa. Agrega tu registro y crea tu tarjeta digital."
        >
          Pon a Sinaloa en el mapa
        </SectionTitle>

        {/* Two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Register */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
              <Plus className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-sm font-bold text-primary mb-2">Agrega tu registro</h3>
            <p className="text-xs text-muted leading-relaxed flex-1">
              Ya seas startup, consultoría, comunidad o profesional tech — si estás
              construyendo desde Sinaloa, mereces ser visible.
            </p>
            <Link
              href="/dashboard"
              className={btn({ variant: 'accent', size: 'md' }, 'mt-4 w-fit')}
            >
              Agregar registro
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 2: Wallet */}
          <div className="bg-card border border-accent/15 rounded-xl p-6 flex flex-col relative overflow-hidden">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-accent" />
              </div>
              <span className="text-2xs font-mono font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Nuevo
              </span>
            </div>
            <h3 className="text-sm font-bold text-primary mb-2">Tu tarjeta digital</h3>
            <p className="text-xs text-muted leading-relaxed flex-1">
              Crea tu tarjeta de presentación para Apple Wallet y Google Wallet. Comparte tu perfil tech con un tap.
            </p>

            {/* Mini card preview */}
            <div className="mt-4 mb-4 bg-card/80 border border-border rounded-lg p-3 flex items-center gap-3">
              <div className="w-9 h-12 bg-elevated border border-border rounded-md flex flex-col items-center justify-center shrink-0">
                <div className="w-4 h-4 rounded-sm bg-accent/20 mb-1" />
                <div className="w-5 h-0.5 bg-border rounded" />
                <div className="w-3.5 h-0.5 bg-border rounded mt-0.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-secondary">Tu Nombre</div>
                <div className="text-2xs text-muted font-mono">Tu título · Tu empresa</div>
              </div>
            </div>

            <Link
              href="/dashboard"
              className={btn({ variant: 'accent', size: 'md' }, 'w-fit')}
            >
              Regístrate para obtenerla
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Bottom explore link */}
        <p className="text-center text-xs text-muted mt-6">
          O{' '}
          <Link href="/directorio" className="text-secondary hover:text-primary underline">
            explora el directorio
          </Link>{' '}
          para ver quién ya está aquí.
        </p>
      </div>
    </section>
  )
}
