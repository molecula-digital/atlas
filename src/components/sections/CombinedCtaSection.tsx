import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'
import { SectionTitle } from '@/components/ui/SectionTitle'

export function CombinedCtaSection() {
  return (
    <section className="py-4">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <SectionTitle
          align="center"
          className="mb-8"
          titleClassName="uppercase"
          description="Únete al ecosistema tech de Sinaloa. Agrega tu registro al directorio."
        >
          Pon a Sinaloa en el mapa
        </SectionTitle>

        {/* Register card */}
        <div className="max-w-md mx-auto">
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
              className={buttonVariants({ variant: 'accent', size: 'md', className: 'mt-4 w-fit' })}
            >
              Agregar registro
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
