'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { AtlasEntryType } from '@/config'
import {
  toEntrySubmission,
  uploadEntryImage,
  type EntryFormValues,
} from '@/lib/entry-submission'
import { replaceObjectUrl, revokeObjectUrl } from '@/lib/object-url'
import posthog from 'posthog-js'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'
import { captureRequestFailed } from '@/lib/analytics'

export interface EntryData {
  id: string
  entryType: AtlasEntryType
  name: string
  slug: string
  tagline?: string
  city: string
  website?: string
  x?: string
  instagram?: string
  linkedin?: string
  github?: string
  youtube?: string
  discord?: string
  telegram?: string
  tags?: { tag: string; id?: string }[]
  _status: 'draft' | 'published'
  moderationNote?: string
  // startup-like
  foundedYear?: number
  stage?: string
  teamSize?: string
  sector?: string
  technologies?: { technology: string; id?: string }[]
  hiringUrl?: string
  businessModel?: string
  // community
  memberCount?: number
  meetupFrequency?: string
  // person
  role?: string
  company?: string
  email?: string
  portfolio?: string
  availableForHire?: boolean
  availableForMentoring?: boolean
  body?: string | null
  logo?: { id: number; url?: string; alt?: string } | number | null
  coverImage?: { id: number; url?: string; alt?: string } | number | null
}

/** Loads an owned entry, holds the edit state, and saves it back. */
export function useEntryEditor(id: string) {
  const [entry, setEntry] = useState<EntryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [city, setCity] = useState('')
  const [website, setWebsite] = useState('')
  const [x, setX] = useState('')
  const [instagram, setInstagram] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [github, setGithub] = useState('')
  const [youtube, setYoutube] = useState('')
  const [discord, setDiscord] = useState('')
  const [telegram, setTelegram] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  // startup-like
  const [foundedYear, setFoundedYear] = useState('')
  const [stage, setStage] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [sector, setSector] = useState('')
  const [technologies, setTechnologies] = useState('')
  const [hiring, setHiring] = useState(false)
  const [hiringUrl, setHiringUrl] = useState('')
  const [businessModel, setBusinessModel] = useState('')
  // community
  const [memberCount, setMemberCount] = useState('')
  const [meetupFrequency, setMeetupFrequency] = useState('')
  // person
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [availableForHire, setAvailableForHire] = useState(false)
  const [availableForMentoring, setAvailableForMentoring] = useState(false)

  // Body (markdown)
  const [bodyMarkdown, setBodyMarkdown] = useState('')

  // Images
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [hasNewLogo, setHasNewLogo] = useState(false)
  const [hasNewCover, setHasNewCover] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  // Mirrors of the previews, so unmount cleanup doesn't re-run on every change.
  const logoPreviewRef = useRef<string | null>(null)
  const coverPreviewRef = useRef<string | null>(null)
  useEffect(() => {
    logoPreviewRef.current = logoPreview
    coverPreviewRef.current = coverPreview
  }, [logoPreview, coverPreview])

  // Fetch entry
  useEffect(() => {
    async function fetchEntry() {
      try {
        const res = await fetch(`/api/submissions/entries?id=${id}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'No se pudo cargar la entrada')
          return
        }
        const data: EntryData = await res.json()
        setEntry(data)

        // Populate form
        setName(data.name || '')
        setTagline(data.tagline || '')
        setCity(data.city || '')
        setWebsite(data.website || '')
        setX(data.x || '')
        setInstagram(data.instagram || '')
        setLinkedin(data.linkedin || '')
        setGithub(data.github || '')
        setYoutube(data.youtube || '')
        setDiscord(data.discord || '')
        setTelegram(data.telegram || '')
        setTags(data.tags?.map((t) => t.tag) || [])
        setFoundedYear(data.foundedYear?.toString() || '')
        setStage(data.stage || '')
        setTeamSize(data.teamSize || '')
        setSector(data.sector || '')
        setTechnologies(
          data.technologies?.map((t) => t.technology).join(', ') || '',
        )
        setHiring(Boolean(data.hiringUrl))
        setHiringUrl(data.hiringUrl || '')
        setBusinessModel(data.businessModel || '')
        setMemberCount(data.memberCount?.toString() || '')
        setMeetupFrequency(data.meetupFrequency || '')
        setRole(data.role || '')
        setCompany(data.company || '')
        setEmail(data.email || '')
        setPortfolio(data.portfolio || '')
        setAvailableForHire(data.availableForHire || false)
        setAvailableForMentoring(data.availableForMentoring || false)

        setBodyMarkdown(data.body || '')

        // Set existing image previews
        if (data.logo && typeof data.logo === 'object' && 'url' in data.logo) {
          setLogoPreview(data.logo.url || null)
        }
        if (
          data.coverImage &&
          typeof data.coverImage === 'object' &&
          'url' in data.coverImage
        ) {
          setCoverPreview(data.coverImage.url || null)
        }
      } catch {
        setError('Error de conexion')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchEntry()
  }, [id])

  // Release any blob preview we still hold when the form goes away.
  useEffect(
    () => () => {
      revokeObjectUrl(logoPreviewRef.current)
      revokeObjectUrl(coverPreviewRef.current)
    },
    [],
  )

  const selectLogo = useCallback((file?: File) => {
    if (!file) return
    setHasNewLogo(true)
    setLogoPreview((prev) => replaceObjectUrl(prev, file))
  }, [])

  const selectCover = useCallback((file?: File) => {
    if (!file) return
    setHasNewCover(true)
    setCoverPreview((prev) => replaceObjectUrl(prev, file))
  }, [])

  /** Discards a newly picked file and falls back to the stored image. */
  const resetLogo = useCallback(() => {
    setHasNewLogo(false)
    setLogoPreview((prev) => {
      revokeObjectUrl(prev)
      return entry?.logo &&
        typeof entry.logo === 'object' &&
        'url' in entry.logo
        ? entry.logo.url || null
        : null
    })
    if (logoRef.current) logoRef.current.value = ''
  }, [entry])

  const resetCover = useCallback(() => {
    setHasNewCover(false)
    setCoverPreview((prev) => {
      revokeObjectUrl(prev)
      return entry?.coverImage &&
        typeof entry.coverImage === 'object' &&
        'url' in entry.coverImage
        ? entry.coverImage.url || null
        : null
    })
    if (coverRef.current) coverRef.current.value = ''
  }, [entry])

  const addTag = useCallback(() => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t])
      setTagInput('')
    }
  }, [tagInput, tags])

  const removeTag = useCallback(
    (tag: string) => setTags((prev) => prev.filter((t) => t !== tag)),
    [],
  )

  const values: EntryFormValues = {
    name,
    tagline,
    body: bodyMarkdown,
    city,
    website,
    x,
    instagram,
    linkedin,
    github,
    youtube,
    discord,
    telegram,
    tags,
    foundedYear,
    stage,
    teamSize,
    sector,
    technologies,
    hiring,
    hiringUrl,
    businessModel,
    memberCount,
    meetupFrequency,
    role,
    company,
    email,
    portfolio,
    availableForHire,
    availableForMentoring,
  }

  const handleSave = useCallback(async () => {
    if (!entry) return
    setSaving(true)
    setSaved(false)
    setUploadError(null)

    // Upload new images if selected
    let logoId: number | undefined
    let coverImageId: number | undefined

    const logoFile = logoRef.current?.files?.[0]
    const coverFile = coverRef.current?.files?.[0]

    if (logoFile || coverFile) {
      setUploadingImages(true)
      try {
        if (logoFile) logoId = await uploadEntryImage(logoFile)
        if (coverFile) coverImageId = await uploadEntryImage(coverFile)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error al subir imagenes'
        setUploadError(message)
        setUploadingImages(false)
        setSaving(false)
        return
      }
      setUploadingImages(false)
    }

    const body: Record<string, unknown> = {
      id: entry.id,
      ...toEntrySubmission(values, entry.entryType),
    }
    if (logoId) body.logo = logoId
    if (coverImageId) body.coverImage = coverImageId

    try {
      const res = await fetch('/api/submissions/entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        posthog.capture(ANALYTICS_EVENTS.directoryEntryUpdated, {
          entry_type: entry.entryType,
        })
        setSaved(true)
      } else {
        const data = await res.json().catch(() => ({}))
        const reason = typeof data.error === 'string' ? data.error : null
        captureRequestFailed(
          ANALYTICS_EVENTS.directoryEntryUpdateFailed,
          { status: res.status, reason },
          { entry_type: entry.entryType },
        )
        setError(reason || 'Error al guardar')
      }
    } catch {
      captureRequestFailed(
        ANALYTICS_EVENTS.directoryEntryUpdateFailed,
        { status: null },
        { entry_type: entry.entryType },
      )
      setError('Error de conexion al guardar')
    } finally {
      setSaving(false)
    }
    // `values` is rebuilt each render from the fields below, so they are the real deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    entry,
    name,
    tagline,
    city,
    website,
    x,
    instagram,
    linkedin,
    github,
    youtube,
    discord,
    telegram,
    tags,
    bodyMarkdown,
    foundedYear,
    stage,
    teamSize,
    sector,
    technologies,
    hiring,
    hiringUrl,
    businessModel,
    memberCount,
    meetupFrequency,
    role,
    company,
    email,
    portfolio,
    availableForHire,
    availableForMentoring,
  ])

  return {
    entry,
    loading,
    error,
    saving,
    saved,
    name,
    setName,
    tagline,
    setTagline,
    city,
    setCity,
    website,
    setWebsite,
    x,
    setX,
    instagram,
    setInstagram,
    linkedin,
    setLinkedin,
    github,
    setGithub,
    youtube,
    setYoutube,
    discord,
    setDiscord,
    telegram,
    setTelegram,
    tags,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    foundedYear,
    setFoundedYear,
    stage,
    setStage,
    teamSize,
    setTeamSize,
    sector,
    setSector,
    technologies,
    setTechnologies,
    hiring,
    setHiring,
    hiringUrl,
    setHiringUrl,
    businessModel,
    setBusinessModel,
    memberCount,
    setMemberCount,
    meetupFrequency,
    setMeetupFrequency,
    role,
    setRole,
    company,
    setCompany,
    email,
    setEmail,
    portfolio,
    setPortfolio,
    availableForHire,
    setAvailableForHire,
    availableForMentoring,
    setAvailableForMentoring,
    bodyMarkdown,
    setBodyMarkdown,
    logoPreview,
    hasNewLogo,
    selectLogo,
    resetLogo,
    coverPreview,
    hasNewCover,
    selectCover,
    resetCover,
    uploadingImages,
    uploadError,
    logoRef,
    coverRef,
    handleSave,
  }
}
