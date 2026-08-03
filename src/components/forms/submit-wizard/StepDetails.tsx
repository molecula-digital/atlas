import {
  STAGE_OPTIONS,
  TEAM_SIZE_OPTIONS,
  SECTOR_OPTIONS,
  MEETUP_FREQUENCY_OPTIONS,
  BUSINESS_MODEL_OPTIONS,
  isStartupLike,
} from '@/config'
import type { StepProps } from './types'

export default function StepDetails({ state, setField }: StepProps) {
  const { entryType } = state

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-sans font-bold text-primary">Detalles</h2>
      <p className="text-sm text-secondary">
        {entryType === 'person'
          ? 'Información sobre tu perfil profesional. Todos opcionales.'
          : entryType === 'community'
            ? 'Información sobre tu comunidad. Todos opcionales.'
            : 'Campos específicos según el tipo de registro. Todos opcionales.'}
      </p>
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-mono text-muted uppercase tracking-wider">
            Sector
          </span>
          <select
            value={state.sector}
            onChange={(e) => setField('sector', e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm focus:outline-hidden focus:border-accent transition-colors"
          >
            <option value="">Selecciona</option>
            {SECTOR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {isStartupLike(entryType as string) && (
          <>
            <label className="block">
              <span className="text-xs font-mono text-muted uppercase tracking-wider">
                Año de fundación
              </span>
              <input
                type="number"
                value={state.foundedYear}
                onChange={(e) => setField('foundedYear', e.target.value)}
                placeholder="2024"
                min="1900"
                max="2100"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
              />
            </label>
            {entryType === 'startup' && (
              <label className="block">
                <span className="text-xs font-mono text-muted uppercase tracking-wider">
                  Etapa
                </span>
                <select
                  value={state.stage}
                  onChange={(e) => setField('stage', e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm focus:outline-hidden focus:border-accent transition-colors"
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
              <span className="text-xs font-mono text-muted uppercase tracking-wider">
                Tamaño del equipo
              </span>
              <select
                value={state.teamSize}
                onChange={(e) => setField('teamSize', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm focus:outline-hidden focus:border-accent transition-colors"
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
              <span className="text-xs font-mono text-muted uppercase tracking-wider">
                Tecnologías
              </span>
              <input
                type="text"
                value={state.technologies}
                onChange={(e) => setField('technologies', e.target.value)}
                placeholder="ej. React, Python, AWS (separadas por coma)"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
              />
            </label>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={state.hiring}
                onChange={(e) => setField('hiring', e.target.checked)}
                id="hiring"
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              <label
                htmlFor="hiring"
                className="text-xs font-mono text-muted uppercase tracking-wider"
              >
                Está contratando
              </label>
            </div>
            {state.hiring && (
              <label className="block">
                <span className="text-xs font-mono text-muted uppercase tracking-wider">
                  URL de vacantes
                </span>
                <input
                  type="url"
                  value={state.hiringUrl}
                  onChange={(e) => setField('hiringUrl', e.target.value)}
                  placeholder="https://tu-empresa.com/careers"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
                />
              </label>
            )}
            <label className="block">
              <span className="text-xs font-mono text-muted uppercase tracking-wider">
                Modelo de negocio
              </span>
              <select
                value={state.businessModel}
                onChange={(e) => setField('businessModel', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm focus:outline-hidden focus:border-accent transition-colors"
              >
                <option value="">Selecciona</option>
                {BUSINESS_MODEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {entryType === 'community' && (
          <>
            <label className="block">
              <span className="text-xs font-mono text-muted uppercase tracking-wider">
                Número de miembros
              </span>
              <input
                type="number"
                value={state.memberCount}
                onChange={(e) => setField('memberCount', e.target.value)}
                placeholder="100"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-xs font-mono text-muted uppercase tracking-wider">
                Frecuencia de meetups
              </span>
              <select
                value={state.meetupFrequency}
                onChange={(e) => setField('meetupFrequency', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm focus:outline-hidden focus:border-accent transition-colors"
              >
                <option value="">Selecciona</option>
                {MEETUP_FREQUENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {entryType === 'person' && (
          <>
            <label className="block">
              <span className="text-xs font-mono text-muted uppercase tracking-wider">
                Rol
              </span>
              <input
                type="text"
                value={state.role}
                onChange={(e) => setField('role', e.target.value)}
                placeholder="ej. Frontend Developer, CTO"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-xs font-mono text-muted uppercase tracking-wider">
                Empresa
              </span>
              <input
                type="text"
                value={state.company}
                onChange={(e) => setField('company', e.target.value)}
                placeholder="Empresa actual"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-xs font-mono text-muted uppercase tracking-wider">
                Email de contacto
              </span>
              <input
                type="email"
                value={state.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="tu@email.com"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-xs font-mono text-muted uppercase tracking-wider">
                Portafolio
              </span>
              <input
                type="url"
                value={state.portfolio}
                onChange={(e) => setField('portfolio', e.target.value)}
                placeholder="https://tu-portafolio.com"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
              />
            </label>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={state.availableForHire}
                onChange={(e) => setField('availableForHire', e.target.checked)}
                id="availableForHire"
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              <label
                htmlFor="availableForHire"
                className="text-xs font-mono text-muted uppercase tracking-wider"
              >
                Disponible para contratación
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={state.availableForMentoring}
                onChange={(e) =>
                  setField('availableForMentoring', e.target.checked)
                }
                id="availableForMentoring"
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              <label
                htmlFor="availableForMentoring"
                className="text-xs font-mono text-muted uppercase tracking-wider"
              >
                Disponible para mentoría
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
