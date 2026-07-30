import Link from 'next/link'
import { ArrowLeft, CalendarX } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonVariants } from '@/components/ui/button-variants'

export default function EventNotFound() {
  return (
    <article>
      <Breadcrumb
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Eventos', href: '/eventos' },
          { label: 'No encontrado' },
        ]}
      />

      <h1 className="sr-only">Evento no encontrado</h1>

      <EmptyState
        icon={CalendarX}
        title="Evento no encontrado"
        subtitle="El evento no existe, cambió de dirección o ya no está disponible."
        className="rounded-xl border border-border bg-card/80 px-6 py-24 backdrop-blur-sm"
        action={
          <Link
            href="/eventos"
            className={buttonVariants({ variant: 'accent', size: 'md' })}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a eventos
          </Link>
        }
      />
    </article>
  )
}
