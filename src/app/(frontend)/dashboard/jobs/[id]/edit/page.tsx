'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Card } from '@/components/ui/Card'
import { CITY_SELECT_OPTIONS, JOB_TYPE_OPTIONS, MODALITY_OPTIONS } from '@/config'
import { XCircle, ArrowLeft, Save, CheckCircle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'

interface JobData {
  id: string
  title: string
  slug: string
  description?: { root?: { children?: Array<{ children?: Array<{ text?: string }> }> } }
  type: string
  modality: string
  city?: string
  compensation?: string
  tags?: { tag: string; id?: string }[]
  contactUrl: string
  entry?: string
  _status: 'draft' | 'published'
  moderationNote?: string
}

const inputClass =
  'w-full px-3 py-2 bg-background border border-border rounded-md text-base sm:text-sm text-primary'
const selectClass =
  'w-full px-3 py-2 bg-background border border-border rounded-md text-base sm:text-sm text-primary'
const labelClass = 'block text-xs font-mono text-muted mb-1'

/** Extract plain text from Lexical rich-text JSON */
function extractPlainText(description?: JobData['description']): string {
  if (!description?.root?.children) return ''
  return description.root.children
    .map((paragraph) =>
      paragraph.children?.map((child) => child.text || '').join('') ?? '',
    )
    .join('\n')
}

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [job, setJob] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [modality, setModality] = useState('')
  const [city, setCity] = useState('')
  const [compensation, setCompensation] = useState('')
  const [contactUrl, setContactUrl] = useState('')
  const [description, setDescription] = useState('')

  // Fetch job
  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/submissions/jobs?id=${id}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'No se pudo cargar el empleo')
          return
        }
        const data: JobData = await res.json()
        setJob(data)

        // Populate form
        setTitle(data.title || '')
        setType(data.type || '')
        setModality(data.modality || '')
        setCity(data.city || '')
        setCompensation(data.compensation || '')
        setContactUrl(data.contactUrl || '')
        setDescription(extractPlainText(data.description))
      } catch {
        setError('Error de conexion')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchJob()
  }, [id])

  const handleSave = useCallback(async () => {
    if (!job) return
    setSaving(true)
    setSaved(false)

    const body: Record<string, unknown> = {
      id: job.id,
      title,
      type,
      modality,
      city: city || undefined,
      compensation: compensation || undefined,
      contactUrl,
      description: {
        root: {
          type: 'root',
          children: [{
            type: 'paragraph',
            children: [{ type: 'text', text: description, version: 1 }],
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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setSaved(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al guardar')
      }
    } catch {
      setError('Error de conexion al guardar')
    } finally {
      setSaving(false)
    }
  }, [job, title, type, modality, city, compensation, contactUrl, description])

  return (
    <AuthGuard>
      <section>
        <div className="max-w-2xl mx-auto">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Mis Empleos', href: '/dashboard' },
              { label: 'Editar' },
            ]}
          />

          {loading && (
            <div className="space-y-4">
              <div className="animate-pulse h-8 w-48 bg-elevated rounded" />
              <div className="animate-pulse h-64 bg-elevated rounded-lg" />
            </div>
          )}

          {error && !loading && (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <p className="text-sm text-primary font-medium mb-2">Error</p>
              <p className="text-xs text-muted font-mono mb-4">{error}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-xs font-mono text-accent hover:underline"
              >
                Volver al dashboard
              </button>
            </div>
          )}

          {!loading && !error && job && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => router.push('/dashboard')}
                  className={buttonVariants({ variant: "ghost", size: "icon-md" })}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-primary mb-0.5">Editar empleo</h1>
                  <p className="text-xs text-muted font-mono">{job.slug}</p>
                </div>
              </div>

              {/* Moderation note */}
              {job.moderationNote && job._status === 'draft' && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-xs uppercase font-mono mb-1">Nota de moderacion</p>
                    <p>{job.moderationNote}</p>
                  </div>
                </div>
              )}

              {/* Success message */}
              {saved && (
                <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-xs uppercase font-mono mb-1">Cambios guardados</p>
                    <p>Tu empleo ha sido actualizado y sera revisado nuevamente por el equipo de moderacion.</p>
                  </div>
                </div>
              )}

              <Card className="md:p-8">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSave()
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="title" className={labelClass}>Titulo *</label>
                    <input
                      id="title"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={inputClass}
                      placeholder="Ej: Frontend Developer"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="type" className={labelClass}>Tipo *</label>
                      <select
                        id="type"
                        required
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className={selectClass}
                      >
                        {JOB_TYPE_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="modality" className={labelClass}>Modalidad *</label>
                      <select
                        id="modality"
                        required
                        value={modality}
                        onChange={(e) => setModality(e.target.value)}
                        className={selectClass}
                      >
                        {MODALITY_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="city" className={labelClass}>Ciudad (si aplica)</label>
                      <select
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">No aplica</option>
                        {CITY_SELECT_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="compensation" className={labelClass}>Compensacion</label>
                      <input
                        id="compensation"
                        value={compensation}
                        onChange={(e) => setCompensation(e.target.value)}
                        className={inputClass}
                        placeholder="Ej: $15k/mo, Equity, Voluntario"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contactUrl" className={labelClass}>URL o email de contacto *</label>
                    <input
                      id="contactUrl"
                      required
                      value={contactUrl}
                      onChange={(e) => setContactUrl(e.target.value)}
                      className={inputClass}
                      placeholder="https://... o email@..."
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className={labelClass}>Descripcion *</label>
                    <textarea
                      id="description"
                      required
                      rows={6}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={inputClass}
                      placeholder="Describe el puesto, requisitos, beneficios..."
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="text-xs font-mono text-muted hover:text-primary transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !title.trim() || !type || !modality || !contactUrl.trim()}
                      className={buttonVariants({ variant: "accent", size: "md" })}
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              </Card>
            </>
          )}
        </div>
      </section>
    </AuthGuard>
  )
}
