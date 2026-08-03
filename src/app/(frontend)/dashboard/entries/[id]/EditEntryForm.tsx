'use client'

import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Card } from '@/components/ui/Card'
import { EntryBadge } from '@/components/entries/EntryBadge'
import {
  XCircle,
  X,
  Plus,
  ArrowLeft,
  Save,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import {
  SINALOA_CITIES,
  STAGE_OPTIONS,
  TEAM_SIZE_OPTIONS,
  SECTOR_OPTIONS,
  MEETUP_FREQUENCY_OPTIONS,
  BUSINESS_MODEL_OPTIONS,
  ENTRY_TYPE_CONFIG,
  isStartupLike,
} from '@/config'
import { buttonVariants } from '@/components/ui/button-variants'
import { useEntryEditor } from './useEntryEditor'

const cities = [
  { id: 'global', name: 'Global (sin ubicacion especifica)' },
  ...SINALOA_CITIES.map((m) => ({ id: m.id, name: m.name })),
]

const inputClass =
  'mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-base sm:text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors'
const selectClass =
  'mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-base sm:text-sm focus:outline-hidden focus:border-accent transition-colors'
const labelClass = 'text-xs font-mono text-muted uppercase tracking-wider'
const checkboxClass =
  'w-4 h-4 rounded border-border text-accent focus:ring-accent'

export function EditEntryForm() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const {
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
    selectLogo,
    resetLogo,
    coverPreview,
    selectCover,
    resetCover,
    uploadingImages,
    uploadError,
    logoRef,
    coverRef,
    handleSave,
  } = useEntryEditor(id)

  return (
    <AuthGuard>
      <section>
        <div className="max-w-2xl mx-auto">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Mis Registros', href: '/dashboard' },
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

          {!loading && !error && entry && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => router.push('/dashboard')}
                  className={buttonVariants({
                    variant: 'ghost',
                    size: 'icon-md',
                  })}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h1 className="text-xl font-bold text-primary">
                      Editar entrada
                    </h1>
                    <EntryBadge entryType={entry.entryType} />
                  </div>
                  <p className="text-xs text-muted font-mono">
                    {ENTRY_TYPE_CONFIG[entry.entryType]?.label} &middot;{' '}
                    {entry.slug}
                  </p>
                </div>
              </div>

              {/* Moderation note */}
              {entry.moderationNote && entry._status === 'draft' && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-xs uppercase font-mono mb-1">
                      Nota de moderacion
                    </p>
                    <p>{entry.moderationNote}</p>
                  </div>
                </div>
              )}

              {/* Success message */}
              {saved && (
                <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-xs uppercase font-mono mb-1">
                      Cambios guardados
                    </p>
                    <p>
                      Tu entrada ha sido actualizada y sera revisada nuevamente
                      por el equipo de moderacion.
                    </p>
                  </div>
                </div>
              )}

              <Card className="md:p-8">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSave()
                  }}
                  className="space-y-8"
                >
                  {/* ── Images ── */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-sans font-bold text-primary">
                      Imagenes
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <span className={`${labelClass} block mb-1`}>Logo</span>
                        {logoPreview && !logoRef.current?.files?.[0] && (
                          <div className="mb-2 relative w-20 h-20">
                            <img
                              src={logoPreview}
                              alt="Logo actual"
                              className="w-20 h-20 rounded-lg border border-border object-cover"
                            />
                          </div>
                        )}
                        <input
                          ref={logoRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={(e) => selectLogo(e.target.files?.[0])}
                          className="w-full text-xs text-muted font-mono file:mr-3 file:py-1 file:px-2.5 file:rounded file:border file:border-border file:text-xs file:font-mono file:font-semibold file:bg-transparent file:text-primary hover:file:border-accent hover:file:text-accent file:transition-colors file:cursor-pointer"
                        />
                        {logoRef.current?.files?.[0] && logoPreview && (
                          <div className="mt-2 relative w-20 h-20">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="w-20 h-20 rounded-lg border border-border object-cover"
                            />
                            <button
                              type="button"
                              onClick={resetLogo}
                              className="absolute -top-2 -right-2 w-5 h-5 rounded-full border border-red-500/70 bg-transparent text-red-500 backdrop-blur-sm flex items-center justify-center hover:border-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className={`${labelClass} block mb-1`}>
                          Imagen de portada
                        </span>
                        {coverPreview && !coverRef.current?.files?.[0] && (
                          <div className="mb-2 relative">
                            <img
                              src={coverPreview}
                              alt="Portada actual"
                              className="w-full max-h-48 rounded-lg border border-border object-cover"
                            />
                          </div>
                        )}
                        <input
                          ref={coverRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={(e) => selectCover(e.target.files?.[0])}
                          className="w-full text-xs text-muted font-mono file:mr-3 file:py-1 file:px-2.5 file:rounded file:border file:border-border file:text-xs file:font-mono file:font-semibold file:bg-transparent file:text-primary hover:file:border-accent hover:file:text-accent file:transition-colors file:cursor-pointer"
                        />
                        {coverRef.current?.files?.[0] && coverPreview && (
                          <div className="mt-2 relative">
                            <img
                              src={coverPreview}
                              alt="Cover preview"
                              className="w-full max-h-48 rounded-lg border border-border object-cover"
                            />
                            <button
                              type="button"
                              onClick={resetCover}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full border border-red-500/70 bg-transparent text-red-500 backdrop-blur-sm flex items-center justify-center hover:border-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {uploadError && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                        {uploadError}
                      </div>
                    )}
                  </div>

                  {/* ── Basic info ── */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-sans font-bold text-primary">
                      Informacion basica
                    </h2>
                    <div className="space-y-3">
                      <label className="block">
                        <span className={labelClass}>Nombre *</span>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Tagline</span>
                        <input
                          type="text"
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value)}
                          placeholder="Una frase corta descriptiva"
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Municipio *</span>
                        <select
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className={selectClass}
                        >
                          <option value="">Selecciona un municipio</option>
                          {cities.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className={labelClass}>Sitio web</span>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://tu-sitio.com"
                          className={inputClass}
                        />
                      </label>
                    </div>
                  </div>

                  {/* ���─ Body (Markdown) ── */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-sans font-bold text-primary">
                      Descripcion
                    </h2>
                    <label className="block">
                      <span className={labelClass}>Contenido (Markdown)</span>
                      <textarea
                        value={bodyMarkdown}
                        onChange={(e) => setBodyMarkdown(e.target.value)}
                        rows={8}
                        placeholder="Describe tu entrada en detalle. Puedes usar Markdown: **negritas**, *italicas*, ## encabezados, - listas, [enlaces](url)"
                        className={`${inputClass} resize-y`}
                      />
                      <p className="text-xs text-muted mt-1 font-mono">
                        Soporta: encabezados (#), **negritas**, *italicas*,
                        `codigo`, [enlaces](url), listas (- o 1.)
                      </p>
                    </label>
                  </div>

                  {/* ── Type-specific: Startup-like ── */}
                  {isStartupLike(entry.entryType) && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-sans font-bold text-primary">
                        Detalles
                      </h2>
                      <div className="space-y-3">
                        <label className="block">
                          <span className={labelClass}>Sector</span>
                          <select
                            value={sector}
                            onChange={(e) => setSector(e.target.value)}
                            className={selectClass}
                          >
                            <option value="">Selecciona</option>
                            {SECTOR_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className={labelClass}>Ano de fundacion</span>
                          <input
                            type="number"
                            value={foundedYear}
                            onChange={(e) => setFoundedYear(e.target.value)}
                            placeholder="2024"
                            min="1900"
                            max="2100"
                            className={inputClass}
                          />
                        </label>
                        {entry.entryType === 'startup' && (
                          <label className="block">
                            <span className={labelClass}>Etapa</span>
                            <select
                              value={stage}
                              onChange={(e) => setStage(e.target.value)}
                              className={selectClass}
                            >
                              <option value="">Selecciona</option>
                              {STAGE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        <label className="block">
                          <span className={labelClass}>Tamano del equipo</span>
                          <select
                            value={teamSize}
                            onChange={(e) => setTeamSize(e.target.value)}
                            className={selectClass}
                          >
                            <option value="">Selecciona</option>
                            {TEAM_SIZE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className={labelClass}>Tecnologias</span>
                          <input
                            type="text"
                            value={technologies}
                            onChange={(e) => setTechnologies(e.target.value)}
                            placeholder="ej. React, Python, AWS (separadas por coma)"
                            className={inputClass}
                          />
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={hiring}
                            onChange={(e) => setHiring(e.target.checked)}
                            id="hiring"
                            className={checkboxClass}
                          />
                          <label htmlFor="hiring" className={labelClass}>
                            Esta contratando
                          </label>
                        </div>
                        {hiring && (
                          <label className="block">
                            <span className={labelClass}>URL de vacantes</span>
                            <input
                              type="url"
                              value={hiringUrl}
                              onChange={(e) => setHiringUrl(e.target.value)}
                              placeholder="https://tu-empresa.com/careers"
                              className={inputClass}
                            />
                          </label>
                        )}
                        <label className="block">
                          <span className={labelClass}>Modelo de negocio</span>
                          <select
                            value={businessModel}
                            onChange={(e) => setBusinessModel(e.target.value)}
                            className={selectClass}
                          >
                            <option value="">Selecciona</option>
                            {BUSINESS_MODEL_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* ── Type-specific: Community ── */}
                  {entry.entryType === 'community' && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-sans font-bold text-primary">
                        Detalles de comunidad
                      </h2>
                      <div className="space-y-3">
                        <label className="block">
                          <span className={labelClass}>Numero de miembros</span>
                          <input
                            type="number"
                            value={memberCount}
                            onChange={(e) => setMemberCount(e.target.value)}
                            placeholder="100"
                            className={inputClass}
                          />
                        </label>
                        <label className="block">
                          <span className={labelClass}>
                            Frecuencia de meetups
                          </span>
                          <select
                            value={meetupFrequency}
                            onChange={(e) => setMeetupFrequency(e.target.value)}
                            className={selectClass}
                          >
                            <option value="">Selecciona</option>
                            {MEETUP_FREQUENCY_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* ── Type-specific: Person ── */}
                  {entry.entryType === 'person' && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-sans font-bold text-primary">
                        Perfil profesional
                      </h2>
                      <div className="space-y-3">
                        <label className="block">
                          <span className={labelClass}>Rol</span>
                          <input
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="ej. Frontend Developer, CTO"
                            className={inputClass}
                          />
                        </label>
                        <label className="block">
                          <span className={labelClass}>Empresa</span>
                          <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="Empresa actual"
                            className={inputClass}
                          />
                        </label>
                        <label className="block">
                          <span className={labelClass}>Email de contacto</span>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className={inputClass}
                          />
                        </label>
                        <label className="block">
                          <span className={labelClass}>Portafolio</span>
                          <input
                            type="url"
                            value={portfolio}
                            onChange={(e) => setPortfolio(e.target.value)}
                            placeholder="https://tu-portafolio.com"
                            className={inputClass}
                          />
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={availableForHire}
                            onChange={(e) =>
                              setAvailableForHire(e.target.checked)
                            }
                            id="availableForHire"
                            className={checkboxClass}
                          />
                          <label
                            htmlFor="availableForHire"
                            className={labelClass}
                          >
                            Disponible para contratacion
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={availableForMentoring}
                            onChange={(e) =>
                              setAvailableForMentoring(e.target.checked)
                            }
                            id="availableForMentoring"
                            className={checkboxClass}
                          />
                          <label
                            htmlFor="availableForMentoring"
                            className={labelClass}
                          >
                            Disponible para mentoria
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Social links ── */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-sans font-bold text-primary">
                      Redes sociales
                    </h2>
                    <div className="space-y-3">
                      <label className="block">
                        <span className={labelClass}>X (Twitter)</span>
                        <input
                          type="text"
                          value={x}
                          onChange={(e) => setX(e.target.value)}
                          placeholder="@usuario"
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Instagram</span>
                        <input
                          type="text"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="@usuario"
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>LinkedIn</span>
                        <input
                          type="url"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/in/usuario"
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>GitHub</span>
                        <input
                          type="text"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          placeholder="usuario"
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>YouTube</span>
                        <input
                          type="url"
                          value={youtube}
                          onChange={(e) => setYoutube(e.target.value)}
                          placeholder="https://youtube.com/@canal"
                          className={inputClass}
                        />
                      </label>
                      {entry.entryType === 'community' && (
                        <>
                          <label className="block">
                            <span className={labelClass}>Discord</span>
                            <input
                              type="url"
                              value={discord}
                              onChange={(e) => setDiscord(e.target.value)}
                              placeholder="https://discord.gg/..."
                              className={inputClass}
                            />
                          </label>
                          <label className="block">
                            <span className={labelClass}>Telegram</span>
                            <input
                              type="url"
                              value={telegram}
                              onChange={(e) => setTelegram(e.target.value)}
                              placeholder="https://t.me/..."
                              className={inputClass}
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ── Tags ── */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-sans font-bold text-primary">
                      Etiquetas
                    </h2>
                    <p className="text-sm text-secondary">
                      Agrega hasta 10 etiquetas descriptivas.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag()
                          }
                        }}
                        placeholder="Escribe y presiona Enter"
                        className={`flex-1 px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-base sm:text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors`}
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        disabled={tags.length >= 10}
                        className={buttonVariants({ size: 'icon-lg' })}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:text-red-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted font-mono">
                      {tags.length}/10 etiquetas
                    </p>
                  </div>

                  {/* ── Submit ── */}
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
                      disabled={
                        saving || uploadingImages || !name.trim() || !city
                      }
                      className={buttonVariants({
                        variant: 'accent',
                        size: 'md',
                      })}
                    >
                      <Save className="w-3.5 h-3.5" />
                      {uploadingImages
                        ? 'Subiendo imagenes...'
                        : saving
                          ? 'Guardando...'
                          : 'Guardar cambios'}
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
