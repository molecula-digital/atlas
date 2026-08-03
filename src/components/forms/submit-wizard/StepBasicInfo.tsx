import { TYPE_COPY, type StepProps, type CityOption } from './types'

interface Props extends StepProps {
  cities: CityOption[]
}

export default function StepBasicInfo({ state, setField, cities }: Props) {
  const copy = state.entryType ? TYPE_COPY[state.entryType] : null

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-sans font-bold text-primary">Información</h2>
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-mono text-muted uppercase tracking-wider">
            Nombre *
          </span>
          <input
            type="text"
            value={state.name}
            onChange={(e) => setField('name', e.target.value)}
            required
            placeholder={copy?.namePlaceholder ?? 'Nombre'}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
          />
        </label>
        <label className="block">
          <span className="text-xs font-mono text-muted uppercase tracking-wider">
            Tagline
          </span>
          <input
            type="text"
            value={state.tagline}
            onChange={(e) => setField('tagline', e.target.value)}
            placeholder={
              copy?.taglinePlaceholder ?? 'Una frase corta descriptiva'
            }
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
          />
        </label>
        <label className="block">
          <span className="text-xs font-mono text-muted uppercase tracking-wider">
            Acerca de *
          </span>
          <textarea
            value={state.description}
            onChange={(e) => setField('description', e.target.value)}
            required
            rows={4}
            placeholder={copy?.descriptionPlaceholder ?? 'Describe en detalle'}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors resize-y"
          />
          <p className="text-xs text-muted mt-1 font-mono">
            Este texto será el contenido principal de tu entrada en el
            directorio.
          </p>
        </label>
        <label className="block">
          <span className="text-xs font-mono text-muted uppercase tracking-wider">
            Municipio *
          </span>
          <select
            value={state.city}
            onChange={(e) => setField('city', e.target.value)}
            required
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm focus:outline-hidden focus:border-accent transition-colors"
          >
            <option value="">Selecciona un municipio</option>
            {cities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
