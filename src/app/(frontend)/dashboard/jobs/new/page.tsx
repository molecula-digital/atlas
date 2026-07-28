'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { CITY_SELECT_OPTIONS, JOB_TYPE_OPTIONS, MODALITY_OPTIONS } from '@/config'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { buttonVariants } from '@/components/ui/Button'

export default function NewJobPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title'),
      type: formData.get('type'),
      modality: formData.get('modality'),
      city: formData.get('city') || undefined,
      compensation: formData.get('compensation') || undefined,
      contactUrl: formData.get('contactUrl'),
      description: {
        root: {
          type: 'root',
          children: [{
            type: 'paragraph',
            children: [{ type: 'text', text: formData.get('description') as string, version: 1 }],
            version: 1,
          }],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
    }

    try {
      const res = await fetch('/api/submissions/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Submission failed')
      }

      router.push('/dashboard?submitted=job')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      <section>
        <div className="max-w-2xl mx-auto">
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Publicar empleo' },
          ]} />

          <h1 className="text-2xl font-bold text-primary mb-2">Publicar empleo</h1>
          <p className="text-sm text-muted mb-8">Tu oferta será revisada antes de publicarse.</p>

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-xs font-mono text-muted mb-1">Título *</label>
              <input id="title" name="title" required className="w-full px-3 py-2 bg-background border border-border rounded-md text-base sm:text-sm text-primary" placeholder="Ej: Frontend Developer" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="type" className="block text-xs font-mono text-muted mb-1">Tipo *</label>
                <select id="type" name="type" required className="w-full px-3 py-2 bg-background border border-border rounded-md text-base sm:text-sm text-primary">
                  {JOB_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="modality" className="block text-xs font-mono text-muted mb-1">Modalidad *</label>
                <select id="modality" name="modality" required className="w-full px-3 py-2 bg-background border border-border rounded-md text-base sm:text-sm text-primary">
                  {MODALITY_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="block text-xs font-mono text-muted mb-1">Ciudad (si aplica)</label>
                <select id="city" name="city" className="w-full px-3 py-2 bg-background border border-border rounded-md text-base sm:text-sm text-primary">
                  <option value="">No aplica</option>
                  {CITY_SELECT_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="compensation" className="block text-xs font-mono text-muted mb-1">Compensación</label>
                <input id="compensation" name="compensation" className="w-full px-3 py-2 bg-background border border-border rounded-md text-base sm:text-sm text-primary" placeholder="Ej: $15k/mo, Equity, Voluntario" />
              </div>
            </div>

            <div>
              <label htmlFor="contactUrl" className="block text-xs font-mono text-muted mb-1">URL o email de contacto *</label>
              <input id="contactUrl" name="contactUrl" required className="w-full px-3 py-2 bg-background border border-border rounded-md text-base sm:text-sm text-primary" placeholder="https://... o email@..." />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-mono text-muted mb-1">Descripción *</label>
              <textarea id="description" name="description" required rows={6} className="w-full px-3 py-2 bg-background border border-border rounded-md text-base sm:text-sm text-primary" placeholder="Describe el puesto, requisitos, beneficios..." />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className={buttonVariants({ variant: "accent", size: "md", className: "w-full" })}
            >
              {submitting ? 'Enviando...' : 'Enviar para revisión'}
            </button>
          </form>
        </div>
      </section>
    </AuthGuard>
  )
}
