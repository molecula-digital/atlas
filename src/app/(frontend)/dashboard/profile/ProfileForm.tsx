'use client'

import { signOut } from '@/lib/auth-client'
import Link from 'next/link'
import { Save, Loader2, CheckCircle, AlertCircle, ExternalLink, LogOut } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { NEWSLETTER } from '@/config'
import { PROFILE_BIO_MAX_LENGTH, slugifyProfile } from '@/lib/profile-fields'
import { useProfileForm } from './useProfileForm'

const inputClass =
  'mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-base sm:text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors'
const labelClass = 'text-xs font-mono text-muted uppercase tracking-wider'

export function ProfileForm() {
  const {
    session,
    profile,
    setField,
    setPublic,
    loading,
    saving,
    saved,
    error,
    save,
    showPublicLink,
    publishedSlug,
  } = useProfileForm()

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
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>
          <div>
            <label className={labelClass}>Correo</label>
            <input
              className={inputClass}
              type="email"
              value={profile.email}
              onChange={(e) => setField('email', e.target.value)}
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
              onChange={(e) => setField('title', e.target.value)}
              placeholder="ej. Ingeniero de Software"
            />
          </div>
          <div>
            <label className={labelClass}>Empresa</label>
            <input
              className={inputClass}
              value={profile.company}
              onChange={(e) => setField('company', e.target.value)}
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
            onChange={(e) => setField('bio', e.target.value)}
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
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="+52 667 123 4567"
            />
          </div>
          <div>
            <label className={labelClass}>Sitio web</label>
            <input
              className={inputClass}
              value={profile.website}
              onChange={(e) => setField('website', e.target.value)}
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
              onChange={(e) => setField('linkedin', e.target.value)}
              placeholder="linkedin.com/in/you"
            />
          </div>
          <div>
            <label className={labelClass}>X / Twitter</label>
            <input
              className={inputClass}
              value={profile.x}
              onChange={(e) => setField('x', e.target.value)}
              placeholder="@handle"
            />
          </div>
          <div>
            <label className={labelClass}>GitHub</label>
            <input
              className={inputClass}
              value={profile.github}
              onChange={(e) => setField('github', e.target.value)}
              placeholder="username"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-elevated/40 px-4 py-3 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.isPublic}
              onChange={(e) => setPublic(e.target.checked)}
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
                  onChange={(e) => setField('slug', slugifyProfile(e.target.value))}
                  placeholder="tu-nombre"
                  required
                />
              </div>
              <p className="mt-1 text-2xs text-muted font-mono">
                Obligatorio. Solo minúsculas, números y guiones. Guarda para publicar.
              </p>
              {showPublicLink ? (
                <Link
                  href={`/perfil/${publishedSlug}`}
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
              onChange={(e) => setField('newsletterEnabled', e.target.checked)}
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
            onClick={save}
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
