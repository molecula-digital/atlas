'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession, authClient, signOut } from '@/lib/auth-client'
import Link from 'next/link'
import { Save, Loader2, CheckCircle, AlertCircle, ExternalLink, LogOut } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'
import { NEWSLETTER } from '@/config'
import { PROFILE_BIO_MAX_LENGTH, slugifyProfile } from '@/lib/profile-fields'
import { readJson } from '@/lib/read-json'

interface ProfileData {
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

const inputClass =
  'mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-base sm:text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors'
const labelClass = 'text-xs font-mono text-muted uppercase tracking-wider'

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

export function ProfileForm() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<ProfileData>(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  /** Last persisted public state — link only shows when this is live. */
  const [published, setPublished] = useState<{ isPublic: boolean; slug: string }>({
    isPublic: false,
    slug: '',
  })
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile')
      const parsed = await readJson<Record<string, unknown>>(res)
      if (!res.ok || !parsed.ok || !parsed.data) {
        return
      }
      const data = parsed.data
      const next = parseProfilePayload(data)
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
    if (session) fetchProfile()
  }, [session, fetchProfile])

  const handleChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
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
      setPublished({
        isPublic: next.isPublic,
        slug: next.isPublic ? next.slug : '',
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const showPublicLink =
    published.isPublic &&
    Boolean(published.slug) &&
    profile.isPublic === published.isPublic &&
    profile.slug === published.slug

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="h-4 w-16 bg-elevated rounded animate-pulse" />
          <div className="h-10 bg-elevated rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-10 bg-elevated rounded-lg animate-pulse" />
            <div className="h-10 bg-elevated rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-10 bg-elevated rounded-lg animate-pulse" />
            <div className="h-10 bg-elevated rounded-lg animate-pulse" />
          </div>
          <div className="h-10 bg-elevated rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-10 bg-elevated rounded-lg animate-pulse" />
            <div className="h-10 bg-elevated rounded-lg animate-pulse" />
            <div className="h-10 bg-elevated rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre</label>
            <input
              className={inputClass}
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>
          <div>
            <label className={labelClass}>Correo</label>
            <input
              className={inputClass}
              type="email"
              value={profile.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="tu@email.com"
            />
            <p className="mt-1 text-2xs text-muted font-mono">
              Contacto público (por defecto tu Gmail de inicio de sesión).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Cargo</label>
            <input
              className={inputClass}
              value={profile.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="ej. Ingeniero de Software"
            />
          </div>
          <div>
            <label className={labelClass}>Empresa</label>
            <input
              className={inputClass}
              value={profile.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="ej. Atlas Tech"
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="profile-bio">Sobre ti</label>
          <textarea
            id="profile-bio"
            className={`${inputClass} min-h-28 resize-y leading-relaxed`}
            value={profile.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="Cuéntale a la comunidad en qué trabajas, qué tecnologías usas o en qué te gustaría colaborar."
            maxLength={PROFILE_BIO_MAX_LENGTH}
            rows={4}
          />
          <p className="mt-1 flex items-center justify-between gap-2 text-2xs text-muted font-mono">
            <span>Se muestra en tu perfil público.</span>
            <span className={profile.bio.length >= PROFILE_BIO_MAX_LENGTH ? 'text-accent' : ''}>
              {profile.bio.length}/{PROFILE_BIO_MAX_LENGTH}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Telefono</label>
            <input
              className={inputClass}
              type="tel"
              value={profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+52 667 123 4567"
            />
          </div>
          <div>
            <label className={labelClass}>Sitio web</label>
            <input
              className={inputClass}
              value={profile.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="hola.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>LinkedIn</label>
            <input
              className={inputClass}
              value={profile.linkedin}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              placeholder="linkedin.com/in/you"
            />
          </div>
          <div>
            <label className={labelClass}>X / Twitter</label>
            <input
              className={inputClass}
              value={profile.x}
              onChange={(e) => handleChange('x', e.target.value)}
              placeholder="@handle"
            />
          </div>
          <div>
            <label className={labelClass}>GitHub</label>
            <input
              className={inputClass}
              value={profile.github}
              onChange={(e) => handleChange('github', e.target.value)}
              placeholder="username"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-elevated/40 px-4 py-3 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.isPublic}
              onChange={(e) => {
                const next = e.target.checked
                setProfile((prev) => ({
                  ...prev,
                  isPublic: next,
                  slug: next && !prev.slug && prev.name ? slugifyProfile(prev.name) : prev.slug,
                }))
                setSaved(false)
              }}
              className="mt-0.5 size-4 rounded border-border accent-[var(--accent)]"
            />
            <span>
              <span className="block text-sm text-primary font-medium">Perfil público</span>
              <span className="block text-xs text-muted mt-0.5">
                Aparece en /personas. Desactivado por defecto. No publica tu correo ni teléfono.
              </span>
            </span>
          </label>

          {profile.isPublic && (
            <div>
              <label className={labelClass} htmlFor="profile-slug">Slug público</label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-mono text-muted shrink-0">/perfil/</span>
                <input
                  id="profile-slug"
                  className={inputClass.replace('mt-1 ', '')}
                  value={profile.slug}
                  onChange={(e) => handleChange('slug', slugifyProfile(e.target.value))}
                  placeholder="tu-nombre"
                  required
                />
              </div>
              <p className="mt-1 text-2xs text-muted font-mono">
                Obligatorio. Solo minúsculas, números y guiones. Guarda para publicar.
              </p>
              {showPublicLink ? (
                <Link
                  href={`/perfil/${published.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 mt-1.5 text-xs font-mono text-accent hover:underline"
                >
                  Ver perfil público
                  <ExternalLink className="w-3 h-3" />
                </Link>
              ) : (
                <p className="mt-1.5 text-2xs text-muted font-mono">
                  Guarda el perfil para publicar el enlace en /perfil/{profile.slug || '…'}
                </p>
              )}
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.newsletterEnabled}
              onChange={(e) => handleChange('newsletterEnabled', e.target.checked)}
              className="mt-0.5 size-4 rounded border-border accent-[var(--accent)]"
            />
            <span>
              <span className="block text-sm text-primary font-medium">{NEWSLETTER.profileLabel}</span>
              <span className="block text-xs text-muted mt-0.5">{NEWSLETTER.profileHint}</span>
            </span>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          {error && (
            <span className="flex items-center gap-1 text-xs text-red-400 font-mono">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={buttonVariants({ variant: "accent", size: "md" })}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar perfil'}
          </button>
        </div>
      </div>

      {/* Account / session */}
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-semibold text-primary mb-2">Cuenta</h2>
        <p className="text-sm text-muted mb-4">
          Sesión iniciada con Google{session?.user?.email ? ` (${session.user.email})` : ''}.
        </p>
        <button
          type="button"
          onClick={() => signOut()}
          className={buttonVariants({ variant: 'danger', size: 'md' })}
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
