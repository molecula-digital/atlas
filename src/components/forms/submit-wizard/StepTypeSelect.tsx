import { ENTRY_TYPES, type StepProps } from './types'

export default function StepTypeSelect({ state, setField }: StepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-sans font-bold text-primary">
        Tipo de registro
      </h2>
      <p className="text-sm text-secondary">
        Selecciona la categoría que mejor te describe.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {ENTRY_TYPES.map(({ type, label, desc, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => setField('entryType', type)}
            className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-colors ${
              state.entryType === type
                ? 'border-accent bg-accent/10'
                : 'border-border bg-card hover:border-accent/30'
            }`}
          >
            <Icon
              className={`w-5 h-5 mt-0.5 shrink-0 ${
                state.entryType === type ? 'text-accent' : 'text-muted'
              }`}
            />
            <div>
              <div
                className={`font-mono text-sm font-semibold ${
                  state.entryType === type ? 'text-accent' : 'text-primary'
                }`}
              >
                {label}
              </div>
              <div className="text-xs text-muted mt-0.5">{desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
