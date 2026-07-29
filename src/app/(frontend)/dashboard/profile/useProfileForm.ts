'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession, authClient } from '@/lib/auth-client'
import { readJson } from '@/lib/read-json'
import { slugifyProfile } from '@/lib/profile-fields'
import { uploadMediaFile, validateImageFile } from '@/lib/media-upload'
import { replaceObjectUrl, revokeObjectUrl } from '@/lib/object-url'
import { useFormSubmission } from '@/hooks/useFormSubmission'

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
  const [published, setPublished] = useState<{ isPublic: boolean; slug: string }>({
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
      setPublished({ isPublic: next.isPublic, slug: next.isPublic ? next.slug : '' })
    } catch {
      // No profile yet — use empty form
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) fetchProfile()
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
        slug: next && !prev.slug && prev.name ? slugifyProfile(prev.name) : prev.slug,
      }))
      submission.reset()
    },
    [submission],
  )

  const uploadPhoto = useCallback(async (file: File) => {
    const validationError = validateImageFile(file)
    if (validationError) {
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
      const message = err instanceof Error ? err.message : 'No se pudo subir la foto'
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
      setPhotoError(err instanceof Error ? err.message : 'No se pudo quitar la foto')
    } finally {
      setUploadingPhoto(false)
    }
  }, [])

  const save = useCallback(async () => {
    await submission.run(async () => {
      if (profile.name && profile.name !== session?.user?.name) {
        await authClient.updateUser({ name: profile.name })
      }

      const res = await fetch('/api/user/profile', {
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

      const parsed = await readJson<Record<string, unknown>>(res)
      if (!res.ok || !parsed.ok || !parsed.data) {
        const msg =
          (parsed.ok && parsed.data && typeof parsed.data.error === 'string'
            ? parsed.data.error
            : null) ||
          (!parsed.ok ? parsed.error : null) ||
          'No se pudo guardar'
        throw new Error(msg)
      }

      const savedProfile = parsed.data
      if (typeof savedProfile.error === 'string') {
        throw new Error(savedProfile.error)
      }

      const next = parseProfilePayload({
        ...savedProfile,
        name: profile.name || session?.user?.name || '',
        photo: profile.photo || session?.user?.image || '',
        email: savedProfile.email || profile.email,
      })
      setProfile(next)
      setPublished({ isPublic: next.isPublic, slug: next.isPublic ? next.slug : '' })
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
