'use client'

import { useEffect, useState, useCallback } from 'react'
import { useFormSubmission } from '@/hooks/useFormSubmission'
import posthog from 'posthog-js'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'
import { captureRequestFailed } from '@/lib/analytics'

export interface JobData {
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

export interface JobFormValues {
  title: string
  type: string
  modality: string
  city: string
  compensation: string
  contactUrl: string
  description: string
}

const EMPTY: JobFormValues = {
  title: '',
  type: '',
  modality: '',
  city: '',
  compensation: '',
  contactUrl: '',
  description: '',
}

/** Extract plain text from Lexical rich-text JSON */
export function extractPlainText(description?: JobData['description']): string {
  if (!description?.root?.children) return ''
  return description.root.children
    .map((paragraph) =>
      paragraph.children?.map((child) => child.text || '').join('') ?? '',
    )
    .join('\n')
}

/** Wrap plain text back into the single-paragraph Lexical document the API expects. */
function toLexical(text: string) {
  return {
    root: {
      type: 'root',
      children: [{
        type: 'paragraph',
        children: [{ type: 'text', text, version: 1 }],
        version: 1,
      }],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

export function useJobEditor(id: string) {
  const [job, setJob] = useState<JobData | null>(null)
  const [values, setValues] = useState<JobFormValues>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const submission = useFormSubmission()

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function fetchJob() {
      try {
        const res = await fetch(`/api/submissions/jobs?id=${id}`)
        if (cancelled) return
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setLoadError(data.error || 'No se pudo cargar el empleo')
          return
        }
        const data: JobData = await res.json()
        if (cancelled) return
        setJob(data)
        setValues({
          title: data.title || '',
          type: data.type || '',
          modality: data.modality || '',
          city: data.city || '',
          compensation: data.compensation || '',
          contactUrl: data.contactUrl || '',
          description: extractPlainText(data.description),
        })
      } catch {
        if (!cancelled) setLoadError('Error de conexion')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchJob()
    return () => { cancelled = true }
  }, [id])

  const setField = useCallback(
    <K extends keyof JobFormValues>(field: K, value: JobFormValues[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const save = useCallback(async () => {
    if (!job) return
    const jobProps = { job_type: values.type, modality: values.modality }

    await submission.run(async () => {
      let res: Response
      try {
        res = await fetch('/api/submissions/jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: job.id,
            title: values.title,
            type: values.type,
            modality: values.modality,
            city: values.city || undefined,
            compensation: values.compensation || undefined,
            contactUrl: values.contactUrl,
            description: toLexical(values.description),
          }),
        })
      } catch (err) {
        captureRequestFailed(ANALYTICS_EVENTS.jobUpdateFailed, { status: null }, jobProps)
        throw err
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const reason = typeof data.error === 'string' ? data.error : null
        captureRequestFailed(
          ANALYTICS_EVENTS.jobUpdateFailed,
          { status: res.status, reason },
          jobProps,
        )
        throw new Error(reason || 'Error al guardar')
      }
      posthog.capture(ANALYTICS_EVENTS.jobUpdated, jobProps)
    })
  }, [job, values, submission])

  return {
    job,
    values,
    setField,
    loading,
    // A failed load replaces the form; a failed save shows above it.
    loadError,
    saveError: submission.error,
    saving: submission.submitting,
    saved: submission.succeeded,
    save,
  }
}
