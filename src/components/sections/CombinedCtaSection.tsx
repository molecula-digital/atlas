import { SectionBlock } from '@/components/layout/SectionBlock'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'

export function CombinedCtaSection() {
  return (
    <SectionBlock>
      <div className="flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-sans text-xl font-bold text-primary md:text-2xl">
            ¿Construyes desde Sinaloa?
          </h2>
          <p className="mt-1 max-w-lg text-sm text-secondary">
            Agrega tu startup, consultora, comunidad o perfil. El directorio es
            abierto.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: 'accent-filled', size: 'md' })}
          >
            Agregar registro
          </Link>
          <Link
            href="/directorio"
            className="font-mono text-xs text-secondary hover:text-primary"
          >
            Ver quién ya está
          </Link>
        </div>
      </div>
    </SectionBlock>
  )
}
