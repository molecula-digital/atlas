'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession, authClient } from '@/lib/auth-client'
import { readJson } from '@/lib/read-json'
import { slugifyProfile } from '@/lib/profile-fields'
import { uploadMediaFile, validateImageFile } from '@/lib/media-upload'
import { replaceObjectUrl, revokeObjectUrl } from '@/lib/object-url'
import { useFormSubmission } from '@/hooks/useFormSubmission'
import posthog from 'posthog-js'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'
import { captureRequestFailed } from '@/lib/analytics'

export interface ProfileData {
  name: string
  title: string
  company: string
  bio: string
  email: string
  phone: string
  website: string
  photo: string
  linkedin: string
  x: string
  github: string
  slug: string
  newsletterEnabled: boolean
  isPublic: boolean
}

const emptyProfile: ProfileData = {
  name: '',
  title: '',
  company: '',
  bio: '',
  email: '',
  phone: '',
  website: '',
  photo: '',
  linkedin: '',
  x: '',
  github: '',
  slug: '',
  newsletterEnabled: false,
  isPublic: false,
}

function parseProfilePayload(data: Record<string, unknown>): ProfileData {
  return {
    name: String(data.name || ''),
    title: String(data.title || ''),
    company: String(data.company || ''),
    bio: String(data.bio || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    website: String(data.website || ''),
    photo: String(data.photo || ''),
    linkedin: String(data.linkedin || ''),
    x: String(data.x || ''),
    github: String(data.github || ''),
    slug: String(data.slug || ''),
    newsletterEnabled: Boolean(data.newsletterEnabled),
    isPublic: Boolean(data.isPublic),
  }
}

/** The profile screen's controller: load, edit, save, and what is actually live. */
export function useProfileForm() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<ProfileData>(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  /** Last persisted public state — the link only shows when this is live. */
  const [published, setPublished] = useState<{
    isPublic: boolean
    slug: string
  }>({
    isPublic: false,
    slug: '',
  })

  const submission = useFormSubmission({
    getErrorMessage: (err) =>
      err instanceof Error ? err.message : 'No se pudo guardar el perfil',
  })

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile')
      const parsed = await readJson<Record<string, unknown>>(res)
      if (!res.ok || !parsed.ok || !parsed.data) {
        return
      }
      const next = parseProfilePayload(parsed.data)
      setProfile(next)
      setPublished({
        isPublic: next.isPublic,
        slug: next.isPublic ? next.slug : '',
      })
    } catch {
      // No profile yet — use empty form
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) void Promise.resolve().then(fetchProfile)
  }, [session, fetchProfile])

  useEffect(() => {
    return () => {
      revokeObjectUrl(previewUrlRef.current)
    }
  }, [])

  const setField = useCallback(
    (field: keyof ProfileData, value: string | boolean) => {
      setProfile((prev) => ({ ...prev, [field]: value }))
      submission.reset()
    },
    [submission],
  )

  /** Going public seeds an empty slug from the name, so the URL isn't blank. */
  const setPublic = useCallback(
    (next: boolean) => {
      setProfile((prev) => ({
        ...prev,
        isPublic: next,
        slug:
          next && !prev.slug && prev.name
            ? slugifyProfile(prev.name)
            : prev.slug,
      }))
      submission.reset()
    },
    [submission],
  )

  const uploadPhoto = useCallback(async (file: File) => {
    // Pre-checked here to show the error without touching the network, which
    // means this path never reaches the capture inside uploadMediaFile — so it
    // reports its own, or profile photos would be missing from every
    // validation breakdown.
    const validationError = validateImageFile(file)
    if (validationError) {
      captureRequestFailed(
        ANALYTICS_EVENTS.mediaUploadFailed,
        { status: null, reason: validationError, kind: 'validation' },
        { stage: 'validation', file_type: file.type, file_size: file.size },
      )
      setPhotoError(validationError)
      return
    }

    setPhotoError(null)
    setUploadingPhoto(true)

    const preview = replaceObjectUrl(previewUrlRef.current, file)
    previewUrlRef.current = preview
    if (preview) {
      setProfile((prev) => ({ ...prev, photo: preview }))
    }

    try {
      const media = await uploadMediaFile(file)
      const result = await authClient.updateUser({ image: media.url })
      if (result.error) {
        throw new Error(result.error.message || 'No se pudo actualizar la foto')
      }

      revokeObjectUrl(previewUrlRef.current)
      previewUrlRef.current = null
      setProfile((prev) => ({ ...prev, photo: media.url }))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo subir la foto'
      setPhotoError(message)
      // Keep the blob preview so the user still sees what they picked; clear on next success.
    } finally {
      setUploadingPhoto(false)
    }
  }, [])

  const removePhoto = useCallback(async () => {
    setPhotoError(null)
    setUploadingPhoto(true)
    try {
      const result = await authClient.updateUser({ image: '' })
      if (result.error) {
        throw new Error(result.error.message || 'No se pudo quitar la foto')
      }
      revokeObjectUrl(previewUrlRef.current)
      previewUrlRef.current = null
      setProfile((prev) => ({ ...prev, photo: '' }))
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : 'No se pudo quitar la foto',
      )
    } finally {
      setUploadingPhoto(false)
    }
  }, [])

  const save = useCallback(async () => {
    await submission.run(async () => {
      if (profile.name && profile.name !== session?.user?.name) {
        // Better Auth resolves with { error } rather than throwing, the same
        // way uploadPhoto and removePhoto above handle it. A try/catch here
        // would only ever see a transport failure and would let a rejected
        // rename fall through to the profile request below — the user would
        // be shown success for a name that never changed.
        const renamed = await authClient.updateUser({ name: profile.name })
        if (renamed.error) {
          const message =
            renamed.error.message || 'No se pudo actualizar el nombre'
          captureRequestFailed(ANALYTICS_EVENTS.profileUpdateFailed, {
            status: renamed.error.status ?? null,
            reason: message,
          })
          throw new Error(message)
        }
      }

      let res: Response
      try {
        res = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: profile.email,
            slug: profile.slug,
            title: profile.title,
            company: profile.company,
            bio: profile.bio,
            phone: profile.phone,
            website: profile.website,
            linkedin: profile.linkedin,
            x: profile.x,
            github: profile.github,
            newsletterEnabled: profile.newsletterEnabled,
            isPublic: profile.isPublic,
          }),
        })
      } catch (err) {
        captureRequestFailed(ANALYTICS_EVENTS.profileUpdateFailed, {
          status: null,
        })
        throw err
      }

      const parsed = await readJson<Record<string, unknown>>(res)
      if (!res.ok || !parsed.ok || !parsed.data) {
        const msg =
          (parsed.ok && parsed.data && typeof parsed.data.error === 'string'
            ? parsed.data.error
            : null) ||
          (!parsed.ok ? parsed.error : null) ||
          'No se pudo guardar'
        captureRequestFailed(ANALYTICS_EVENTS.profileUpdateFailed, {
          status: res.status,
          reason: msg,
        })
        throw new Error(msg)
      }

      const savedProfile = parsed.data
      if (typeof savedProfile.error === 'string') {
        // A 200 that still reports an error in the body — worth separating from
        // an outright rejection, since only one of the two shows up in logs.
        captureRequestFailed(ANALYTICS_EVENTS.profileUpdateFailed, {
          status: res.status,
          reason: savedProfile.error,
        })
        throw new Error(savedProfile.error)
      }

      const next = parseProfilePayload({
        ...savedProfile,
        name: profile.name || session?.user?.name || '',
        photo: profile.photo || session?.user?.image || '',
        email: savedProfile.email || profile.email,
      })
      setProfile(next)
      setPublished({
        isPublic: next.isPublic,
        slug: next.isPublic ? next.slug : '',
      })
      posthog.capture(ANALYTICS_EVENTS.profileUpdated, {
        is_public: next.isPublic,
      })
    })
  }, [profile, session, submission])

  return {
    session,
    profile,
    setField,
    setPublic,
    loading,
    saving: submission.submitting,
    saved: submission.succeeded,
    error: submission.error,
    save,
    uploadPhoto,
    removePhoto,
    uploadingPhoto,
    photoError,
    /** True only when the live profile matches what is on screen. */
    showPublicLink:
      published.isPublic &&
      Boolean(published.slug) &&
      profile.isPublic === published.isPublic &&
      profile.slug === published.slug,
    publishedSlug: published.slug,
  }
}
