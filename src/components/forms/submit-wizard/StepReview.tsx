import type { RefObject } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { ENTRY_TYPES, type StepProps, type CityOption } from './types'
import { replaceObjectUrl } from '@/lib/object-url'

interface Props extends StepProps {
  cities: CityOption[]
  logoRef: RefObject<HTMLInputElement | null>
  coverRef: RefObject<HTMLInputElement | null>
}

function handleFilePreview(
  file: File | undefined,
  setField: (field: string, value: unknown) => void,
  field: string,
  current: string | null,
) {
  setField(field, replaceObjectUrl(current, file))
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-muted shrink-0">{label}</span>
      <span className="text-xs font-mono text-primary text-right">{value}</span>
    </div>
  )
}

export default function StepReview({
  state,
  setField,
  cities,
  logoRef,
  coverRef,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-sans font-bold text-primary">
        Imágenes y envío
      </h2>

      <div className="space-y-4">
        <div>
          <span className="text-xs font-mono text-muted uppercase tracking-wider block mb-1">
            Logo
          </span>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleFilePreview(
                e.target.files?.[0],
                setField,
                'logoPreview',
                state.logoPreview,
              )
            }
            className="w-full text-xs text-muted font-mono file:mr-3 file:py-1 file:px-2.5 file:rounded file:border file:border-border file:text-xs file:font-mono file:font-semibold file:bg-transparent file:text-primary hover:file:border-accent hover:file:text-accent file:transition-colors file:cursor-pointer"
          />
          {state.logoPreview && (
            <div className="mt-2 relative w-20 h-20">
              <img
                src={state.logoPreview}
                alt="Logo preview"
                className="w-20 h-20 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setField('logoPreview', null)
                  if (logoRef.current) logoRef.current.value = ''
                }}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full border border-red-500/70 bg-transparent text-red-500 backdrop-blur-sm flex items-center justify-center hover:border-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        <div>
          <span className="text-xs font-mono text-muted uppercase tracking-wider block mb-1">
            Imagen de portada
          </span>
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleFilePreview(
                e.target.files?.[0],
                setField,
                'coverPreview',
                state.coverPreview,
              )
            }
            className="w-full text-xs text-muted font-mono file:mr-3 file:py-1 file:px-2.5 file:rounded file:border file:border-border file:text-xs file:font-mono file:font-semibold file:bg-transparent file:text-primary hover:file:border-accent hover:file:text-accent file:transition-colors file:cursor-pointer"
          />
          {state.coverPreview && (
            <div className="mt-2 relative">
              <img
                src={state.coverPreview}
                alt="Cover preview"
                className="w-full max-h-48 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setField('coverPreview', null)
                  if (coverRef.current) coverRef.current.value = ''
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full border border-red-500/70 bg-transparent text-red-500 backdrop-blur-sm flex items-center justify-center hover:border-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload status */}
      {state.uploadingImages && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-accent/30 bg-accent/5">
          <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
          <span className="text-sm font-mono text-accent">
            Subiendo imágenes...
          </span>
        </div>
      )}

      {state.uploadError && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-red-500/30 bg-red-500/5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-sm font-mono text-red-500 block">
              Error al subir imágenes
            </span>
            <span className="text-xs text-red-400 block">
              {state.uploadError}
            </span>
          </div>
        </div>
      )}

      {/* Review summary */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <h3 className="font-mono text-xs text-muted uppercase tracking-wider mb-3">
          Resumen
        </h3>
        <SummaryRow
          label="Tipo"
          value={ENTRY_TYPES.find((t) => t.type === state.entryType)?.label}
        />
        <SummaryRow label="Nombre" value={state.name} />
        {state.tagline && <SummaryRow label="Tagline" value={state.tagline} />}
        <SummaryRow
          label="Municipio"
          value={cities.find((m) => m.id === state.city)?.name}
        />
        {state.website && <SummaryRow label="Web" value={state.website} />}
        {state.tags.length > 0 && (
          <SummaryRow label="Etiquetas" value={state.tags.join(', ')} />
        )}
      </div>
    </div>
  )
}
