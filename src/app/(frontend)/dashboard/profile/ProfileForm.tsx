'use client'

import { signOut } from '@/lib/auth-client'
import Link from 'next/link'
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  LogOut,
  User,
  Briefcase,
  Building2,
  Mail,
  Phone,
  Globe,
  AtSign,
  Link2,
  Eye,
  Newspaper,
  FileText,
  Camera,
  Trash2,
} from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { buttonVariants } from '@/components/ui/button-variants'
import { MarkdownEditor } from '@/components/ui/MarkdownEditor'
import { NEWSLETTER } from '@/config'
import { PROFILE_BIO_MAX_LENGTH, slugifyProfile } from '@/lib/profile-fields'
import { GitHubIcon, LinkedInIcon, XIcon } from '@/components/icons/SocialIcons'
import { useProfileForm } from './useProfileForm'
import type { LucideIcon } from 'lucide-react'

const inputClass =
  'mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-base sm:text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors'
const labelClass = 'text-xs font-mono text-muted uppercase tracking-wider'

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated">
          <Icon className="h-3.5 w-3.5 text-accent" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-primary">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted font-mono leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  )
}

function FieldLabel({
  htmlFor,
  icon: Icon,
  children,
}: {
  htmlFor?: string
  icon: LucideIcon | ((props: { className?: string }) => ReactNode)
  children: ReactNode
}) {
  return (
    <label className={`${labelClass} inline-flex items-center gap-1.5`} htmlFor={htmlFor}>
      <Icon className="h-3 w-3 text-muted" />
      {children}
    </label>
  )
}

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
    uploadPhoto,
    removePhoto,
    uploadingPhoto,
    photoError,
    showPublicLink,
    publishedSlug,
  } = useProfileForm()
  const photoInputRef = useRef<HTMLInputElement>(null)

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((section) => (
          <div key={section} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-elevated animate-pulse" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 bg-elevated rounded animate-pulse" />
                <div className="h-3 w-48 bg-elevated rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-10 bg-elevated rounded-lg animate-pulse" />
              <div className="h-10 bg-elevated rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <FormSection
        icon={User}
        title="Información personal"
        description="Datos básicos que aparecen en tu perfil."
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative shrink-0 self-center sm:self-auto">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-border bg-elevated flex items-center justify-center text-2xl font-mono font-bold text-accent">
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={profile.name || 'Foto de perfil'}
                  className="w-full h-full object-cover"
                />
              ) : (
                (profile.name || session?.user?.name || '?').charAt(0).toUpperCase()
              )}
            </div>
            {uploadingPhoto && (
              <div className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
            <p className="text-xs text-muted font-mono leading-relaxed">
              Foto de perfil (JPEG, PNG, WebP o GIF · máx. 5 MB). Se muestra en /personas.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) void uploadPhoto(file)
                }}
              />
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => photoInputRef.current?.click()}
                className={buttonVariants({ variant: 'neutral', size: 'sm' })}
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                {profile.photo ? 'Cambiar foto' : 'Subir foto'}
              </button>
              {profile.photo && (
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => void removePhoto()}
                  className={buttonVariants({ variant: 'danger', size: 'sm' })}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Quitar
                </button>
              )}
            </div>
            {photoError && (
              <p className="flex items-center justify-center sm:justify-start gap-1 text-xs text-red-400 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {photoError}
              </p>
            )}
          </div>
        </div>

        <div>
          <FieldLabel icon={User}>Nombre</FieldLabel>
          <input
            className={inputClass}
            value={profile.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Tu nombre completo"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel icon={Briefcase}>Cargo</FieldLabel>
            <input
              className={inputClass}
              value={profile.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="ej. Ingeniero de Software"
            />
          </div>
          <div>
            <FieldLabel icon={Building2}>Empresa</FieldLabel>
            <input
              className={inputClass}
              value={profile.company}
              onChange={(e) => setField('company', e.target.value)}
              placeholder="ej. Atlas Tech"
            />
          </div>
        </div>
      </FormSection>

      <div className="border-t border-border" />

      <FormSection
        icon={FileText}
        title="Sobre ti"
        description="Biografía en Markdown. Se muestra en tu perfil público."
      >
        <MarkdownEditor
          id="profile-bio"
          value={profile.bio}
          onChange={(next) => setField('bio', next)}
          maxLength={PROFILE_BIO_MAX_LENGTH}
          rows={6}
          placeholder={
            'Cuéntale a la comunidad en qué trabajas.\n\nPuedes usar **negritas**, *cursivas*, listas y [enlaces](https://…).'
          }
          hint="Markdown · se muestra en /personas"
        />
      </FormSection>

      <div className="border-t border-border" />

      <FormSection
        icon={Phone}
        title="Contacto y redes"
        description="Correo y teléfono para tu tarjeta Wallet (no se publican en /personas). Los enlaces sí aparecen en tu perfil."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel icon={Mail}>Correo</FieldLabel>
            <input
              className={inputClass}
              type="email"
              value={profile.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="tu@email.com"
            />
            <p className="mt-1 text-2xs text-muted font-mono">
              Por defecto tu correo de inicio de sesión.
            </p>
          </div>
          <div>
            <FieldLabel icon={Phone}>Teléfono</FieldLabel>
            <input
              className={inputClass}
              type="tel"
              value={profile.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="+52 667 123 4567"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <FieldLabel icon={Globe}>Sitio web</FieldLabel>
            <input
              className={inputClass}
              value={profile.website}
              onChange={(e) => setField('website', e.target.value)}
              placeholder="hola.com"
            />
          </div>
          <div>
            <FieldLabel icon={LinkedInIcon}>LinkedIn</FieldLabel>
            <input
              className={inputClass}
              value={profile.linkedin}
              onChange={(e) => setField('linkedin', e.target.value)}
              placeholder="linkedin.com/in/you"
            />
          </div>
          <div>
            <FieldLabel icon={XIcon}>X / Twitter</FieldLabel>
            <input
              className={inputClass}
              value={profile.x}
              onChange={(e) => setField('x', e.target.value)}
              placeholder="@handle"
            />
          </div>
          <div>
            <FieldLabel icon={GitHubIcon}>GitHub</FieldLabel>
            <input
              className={inputClass}
              value={profile.github}
              onChange={(e) => setField('github', e.target.value)}
              placeholder="username"
            />
          </div>
        </div>
      </FormSection>

      <div className="border-t border-border" />

      <FormSection
        icon={Newspaper}
        title="Newsletter"
        description="Correos del ecosistema tech de Sinaloa. Máximo uno al mes."
      >
        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border bg-elevated/40 px-4 py-3">
          <input
            type="checkbox"
            checked={profile.newsletterEnabled}
            onChange={(e) => setField('newsletterEnabled', e.target.checked)}
            className="mt-0.5 size-4 rounded border-border accent-[var(--accent)]"
          />
          <span>
            <span className="text-sm text-primary font-medium">{NEWSLETTER.profileLabel}</span>
            <span className="block text-xs text-muted mt-0.5">{NEWSLETTER.profileHint}</span>
          </span>
        </label>
      </FormSection>

      <div className="border-t border-border" />

      <FormSection
        icon={Eye}
        title="Visibilidad"
        description="Controla si tu perfil aparece en el directorio de personas."
      >
        <div className="rounded-lg border border-border bg-elevated/40 px-4 py-3 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.isPublic}
              onChange={(e) => setPublic(e.target.checked)}
              className="mt-0.5 size-4 rounded border-border accent-[var(--accent)]"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm text-primary font-medium">
                <Eye className="h-3.5 w-3.5 text-accent" />
                Perfil público
              </span>
              <span className="block text-xs text-muted mt-0.5">
                Aparece en /personas. Desactivado por defecto. No publica tu correo ni teléfono.
              </span>
            </span>
          </label>

          {profile.isPublic && (
            <div>
              <FieldLabel htmlFor="profile-slug" icon={Link2}>
                Slug público
              </FieldLabel>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-mono text-muted shrink-0">/personas/</span>
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
                  href={`/personas/${publishedSlug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 mt-1.5 text-xs font-mono text-accent hover:underline"
                >
                  Ver perfil público
                  <ExternalLink className="w-3 h-3" />
                </Link>
              ) : (
                <p className="mt-1.5 text-2xs text-muted font-mono">
                  Guarda el perfil para publicar el enlace en /personas/{profile.slug || '…'}
                </p>
              )}
            </div>
          )}
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        {error && (
          <span className="flex items-center gap-1 text-xs text-red-400 font-mono">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </span>
        )}
        <button
          onClick={save}
          disabled={saving}
          className={buttonVariants({ variant: 'accent', size: 'md' })}
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

      <div className="border-t border-border pt-8">
        <div className="flex items-start gap-2.5 mb-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated">
            <AtSign className="h-3.5 w-3.5 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-primary">Cuenta</h2>
            <p className="mt-0.5 text-xs text-muted font-mono">
              Sesión iniciada con Google{session?.user?.email ? ` (${session.user.email})` : ''}.
            </p>
          </div>
        </div>
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
