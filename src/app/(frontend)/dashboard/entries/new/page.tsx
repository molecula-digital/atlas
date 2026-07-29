import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { SINALOA_CITIES } from '@/config'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Card } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/button-variants'
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
      <section>
        <div className="max-w-2xl mx-auto">
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Mis Registros', href: '/dashboard' },
            { label: 'Agregar registro' },
          ]} />

          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: 'ghost', size: 'icon-md' })}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-primary mb-0.5">Agregar registro</h1>
              <p className="text-xs text-muted font-mono">
                Startup, consultora, comunidad o perfil
              </p>
            </div>
          </div>

          <Card className="md:p-8">
            <SubmitWizard cities={cities} />
          </Card>
        </div>
      </section>
    </AuthGuard>
  )
}
