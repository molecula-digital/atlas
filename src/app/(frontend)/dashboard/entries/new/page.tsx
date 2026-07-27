import type { Metadata } from 'next'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { SINALOA_CITIES } from '@/config'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import SubmitWizard from '@/components/forms/submit-wizard'

export const metadata: Metadata = {
  title: 'Agregar Registro',
  robots: { index: false },
}

export default function NewEntryPage() {
  const cities = [
    { id: 'global', name: 'Global (sin ubicación específica)' },
    ...SINALOA_CITIES.map((m) => ({ id: m.id, name: m.name })),
  ]

  return (
    <AuthGuard>
      <section className="py-4">
        <div className="max-w-2xl mx-auto">
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Mis Registros', href: '/dashboard' },
            { label: 'Agregar registro' },
          ]} />

          <h1 className="text-3xl md:text-4xl font-sans font-bold text-primary mb-2">Agregar registro</h1>
          <p className="text-secondary mb-8">
            Registra tu startup, consultora, comunidad o perfil en el directorio tech de Sinaloa.
          </p>

          <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-6 md:p-8">
            <SubmitWizard cities={cities} />
          </div>
        </div>
      </section>
    </AuthGuard>
  )
}
