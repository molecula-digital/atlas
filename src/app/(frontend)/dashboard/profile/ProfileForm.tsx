'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession, authClient, signOut } from '@/lib/auth-client'
import Image from 'next/image'
import Link from 'next/link'
import { Save, Loader2, CheckCircle, AlertCircle, Mail, Phone, Globe, QrCode, Smartphone, ExternalLink, LogOut } from 'lucide-react'
import { btn } from '@/components/ui/button-styles'
import { NEWSLETTER } from '@/config'
import { slugifyProfile } from '@/lib/profile-fields'
import { readJson } from '@/lib/read-json'

interface ProfileData {
  name: string
  title: string
  company: string
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
  const [hasSavedProfile, setHasSavedProfile] = useState(false)
  /** Last persisted public state — link only shows when this is live. */
  const [published, setPublished] = useState<{ isPublic: boolean; slug: string }>({
    isPublic: false,
    slug: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [walletLoading, setWalletLoading] = useState<'apple' | 'google' | null>(null)
  const [walletTab, setWalletTab] = useState<'apple' | 'google'>('apple')

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
      setHasSavedProfile(Boolean(data.userId || data.exists))
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
      setHasSavedProfile(true)
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

  const handleWallet = async (platform: 'apple' | 'google') => {
    setWalletLoading(platform)
    try {
      if (platform === 'apple') {
        const res = await fetch('/api/user/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'apple' }),
        })
        if (!res.ok) {
          const parsed = await readJson<{ error?: string }>(res)
          throw new Error(
            (parsed.ok && parsed.data?.error) ||
              (!parsed.ok ? parsed.error : null) ||
              'No se pudo generar la tarjeta',
          )
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${profile.name.replace(/[^a-zA-Z0-9]/g, '-')}.pkpass`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const res = await fetch('/api/user/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'google' }),
        })
        const parsed = await readJson<{ saveLink?: string; error?: string }>(res)
        if (!res.ok || !parsed.ok || !parsed.data?.saveLink) {
          throw new Error(
            (parsed.ok && parsed.data?.error) ||
              (!parsed.ok ? parsed.error : null) ||
              'No se pudo generar la tarjeta',
          )
        }
        window.open(parsed.data.saveLink, '_blank')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la tarjeta')
    } finally {
      setWalletLoading(null)
    }
  }

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
        <div className="border-t border-border pt-8">
          <div className="h-5 w-40 bg-elevated rounded animate-pulse mb-4" />
          <div className="h-64 bg-elevated rounded-xl animate-pulse" />
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
            className={btn({ variant: "accent", size: "md" })}
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

      {/* Wallet Card Section */}
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-semibold text-primary mb-2">Tarjeta Digital</h2>
        <p className="text-sm text-muted mb-6">
          Vista previa de tu tarjeta de presentacion digital.
        </p>

        {/* Platform Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-elevated rounded-lg w-fit">
          <button
            onClick={() => setWalletTab('apple')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
              walletTab === 'apple'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted hover:text-secondary'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Apple Wallet
          </button>
          <button
            onClick={() => setWalletTab('google')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
              walletTab === 'google'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted hover:text-secondary'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Google Wallet
          </button>
        </div>

        {/* Phone Mockup */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-[280px]">
            {/* Phone Frame */}
            <div className="rounded-[2.5rem] border-[3px] border-primary/20 bg-black p-3 shadow-xl">
              {/* Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-2xl z-10" />
              {/* Screen */}
              <div className="rounded-[2rem] overflow-hidden bg-neutral-900 min-h-[420px] flex flex-col">
                {/* Status bar */}
                <div className="flex items-center justify-between px-6 pt-6 pb-2 text-[10px] text-white/60 font-mono">
                  <span>9:41</span>
                  <div className="flex gap-1 items-center">
                    <div className="w-4 h-2 border border-white/60 rounded-sm relative">
                      <div className="absolute inset-[1px] right-[2px] bg-white/60 rounded-xs" />
                    </div>
                  </div>
                </div>

                {walletTab === 'apple' ? (
                  /* Apple Wallet Pass Preview */
                  <div className="flex-1 flex flex-col px-4 pb-4">
                    {/* Pass card */}
                    <div className="mt-2 rounded-2xl bg-[#0f0f0f] border border-white/10 overflow-hidden flex-1 flex flex-col">
                      {/* Header */}
                      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                            <span className="text-accent text-xs font-bold">TA</span>
                          </div>
                          <span className="text-white/50 text-[10px] font-mono uppercase tracking-wider">Tech Atlas</span>
                        </div>
                        <span className="text-white/30 text-[9px] font-mono">GENERIC</span>
                      </div>

                      {/* Primary field */}
                      <div className="px-4 pt-2 pb-3">
                        <div className="text-white/40 text-[9px] font-mono uppercase tracking-wider">NAME</div>
                        <div className="text-white text-base font-semibold truncate">
                          {profile.name || 'Your Name'}
                        </div>
                      </div>

                      {/* Secondary fields */}
                      <div className="px-4 pb-3 flex gap-4">
                        {(profile.title || !profile.name) && (
                          <div className="flex-1 min-w-0">
                            <div className="text-white/40 text-[8px] font-mono uppercase tracking-wider">TITLE</div>
                            <div className="text-white/90 text-[11px] truncate">{profile.title || '—'}</div>
                          </div>
                        )}
                        {(profile.company || !profile.name) && (
                          <div className="flex-1 min-w-0">
                            <div className="text-white/40 text-[8px] font-mono uppercase tracking-wider">COMPANY</div>
                            <div className="text-white/90 text-[11px] truncate">{profile.company || '—'}</div>
                          </div>
                        )}
                      </div>

                      {/* Auxiliary fields */}
                      <div className="px-4 pb-3 flex gap-4">
                        {profile.email && (
                          <div className="flex-1 min-w-0">
                            <div className="text-white/40 text-[8px] font-mono uppercase tracking-wider">EMAIL</div>
                            <div className="text-white/80 text-[10px] truncate">{profile.email}</div>
                          </div>
                        )}
                        {profile.phone && (
                          <div className="flex-1 min-w-0">
                            <div className="text-white/40 text-[8px] font-mono uppercase tracking-wider">PHONE</div>
                            <div className="text-white/80 text-[10px] truncate">{profile.phone}</div>
                          </div>
                        )}
                      </div>

                      {/* QR Code area */}
                      <div className="mt-auto px-4 pb-4 flex justify-center">
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                          <QrCode className="w-12 h-12 text-neutral-900" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Google Wallet Pass Preview */
                  <div className="flex-1 flex flex-col px-4 pb-4">
                    {/* Pass card */}
                    <div className="mt-2 rounded-2xl bg-white overflow-hidden flex-1 flex flex-col">
                      {/* Header */}
                      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-neutral-100">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                          <span className="text-accent text-xs font-bold">TA</span>
                        </div>
                        <span className="text-neutral-500 text-[11px] font-medium">Tech Atlas</span>
                      </div>

                      {/* Main content */}
                      <div className="px-4 pt-4 pb-3">
                        <div className="text-neutral-900 text-lg font-semibold truncate">
                          {profile.name || 'Your Name'}
                        </div>
                        {profile.title && (
                          <div className="text-neutral-500 text-xs mt-0.5">{profile.title}</div>
                        )}
                      </div>

                      {/* Detail rows */}
                      <div className="px-4 space-y-3 pb-4">
                        {profile.company && (
                          <div className="flex items-center gap-2.5">
                            <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <div>
                              <div className="text-neutral-400 text-[9px] uppercase tracking-wider">Company</div>
                              <div className="text-neutral-700 text-[11px]">{profile.company}</div>
                            </div>
                          </div>
                        )}
                        {profile.email && (
                          <div className="flex items-center gap-2.5">
                            <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <div>
                              <div className="text-neutral-400 text-[9px] uppercase tracking-wider">Email</div>
                              <div className="text-neutral-700 text-[11px]">{profile.email}</div>
                            </div>
                          </div>
                        )}
                        {profile.phone && (
                          <div className="flex items-center gap-2.5">
                            <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <div>
                              <div className="text-neutral-400 text-[9px] uppercase tracking-wider">Phone</div>
                              <div className="text-neutral-700 text-[11px]">{profile.phone}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* QR Code area */}
                      <div className="mt-auto px-4 pb-4 flex justify-center border-t border-neutral-100 pt-4">
                        <div className="w-16 h-16 bg-neutral-50 rounded-lg flex items-center justify-center">
                          <QrCode className="w-12 h-12 text-neutral-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CTA Badge */}
          <button
            onClick={() => handleWallet(walletTab)}
            disabled={!hasSavedProfile || walletLoading !== null}
            className="relative transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {walletLoading === walletTab && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg z-10">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              </div>
            )}
            <Image
              src={walletTab === 'apple' ? '/wallet/apple.svg' : '/wallet/google.svg'}
              alt={walletTab === 'apple' ? 'Add to Apple Wallet' : 'Add to Google Wallet'}
              width={walletTab === 'apple' ? 180 : 210}
              height={48}
              className="h-12 w-auto"
            />
          </button>

          {!hasSavedProfile && (
            <p className="text-xs text-muted font-mono">Guarda tu perfil primero para habilitar las tarjetas.</p>
          )}

          {error && (
            <span className="flex items-center gap-1 text-xs text-red-400 font-mono">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </span>
          )}
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
          className={btn({ variant: 'danger', size: 'md' })}
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
