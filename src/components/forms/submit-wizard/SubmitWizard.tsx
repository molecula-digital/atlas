'use client'

import {
  ArrowLeft,
  ArrowRight,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { useWizardState } from './useWizardState'
import { STEPS, TYPE_COPY, type CityOption } from './types'
import StepTypeSelect from './StepTypeSelect'
import StepBasicInfo from './StepBasicInfo'
import StepDetails from './StepDetails'
import StepLinks from './StepLinks'
import StepReview from './StepReview'
import { buttonVariants } from '@/components/ui/button-variants'

interface Props {
  cities: CityOption[]
}

export default function SubmitWizard({ cities }: Props) {
  const {
    state,
    setField,
    nextStep,
    prevStep,
    canAdvance,
    submit,
    clearResult,
    logoRef,
    coverRef,
  } = useWizardState()

  const copy = state.entryType ? TYPE_COPY[state.entryType] : null

  if (state.result === 'success') {
    return (
      <div className="text-center py-16 space-y-4">
        <CheckCircle className="w-16 h-16 mx-auto text-accent" />
        <h2 className="text-2xl font-sans font-bold text-primary">
          {copy?.successTitle ?? 'Registro enviado'}
        </h2>
        <p className="text-secondary max-w-md mx-auto">
          {copy?.successMessage ??
            'Tu registro ha sido recibido. Lo revisaremos y lo agregaremos al directorio pronto.'}
        </p>
        <a
          href="/directorio"
          className={buttonVariants({
            variant: 'accent',
            size: 'md',
            className: 'mt-4',
          })}
        >
          VER DIRECTORIO
        </a>
      </div>
    )
  }

  if (state.result === 'error') {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
        <h2 className="text-2xl font-sans font-bold text-primary">
          Error al enviar
        </h2>
        <p className="text-secondary max-w-md mx-auto">
          Hubo un problema al enviar tu registro. Por favor intenta de nuevo.
        </p>
        <button
          onClick={clearResult}
          className={buttonVariants({
            variant: 'accent',
            size: 'md',
            className: 'mt-4',
          })}
        >
          INTENTAR DE NUEVO
        </button>
      </div>
    )
  }

  const CurrentStepIcon = STEPS[state.step].icon

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {/* Step header */}
      <div className="space-y-4">
        {/* Progress bars */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  i <= state.step ? 'bg-accent' : 'bg-border'
                }`}
              />
            </div>
          ))}
        </div>
        {/* Step info with icon */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <CurrentStepIcon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-xs font-mono text-muted block leading-tight">
              PASO {state.step + 1} DE {STEPS.length}
            </span>
            <span className="text-sm font-mono font-semibold text-accent tracking-wide">
              {STEPS[state.step].label.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Step content */}
      {state.step === 0 && <StepTypeSelect state={state} setField={setField} />}
      {state.step === 1 && (
        <StepBasicInfo state={state} setField={setField} cities={cities} />
      )}
      {state.step === 2 && <StepDetails state={state} setField={setField} />}
      {state.step === 3 && <StepLinks state={state} setField={setField} />}
      {state.step === 4 && (
        <StepReview
          state={state}
          setField={setField}
          cities={cities}
          logoRef={logoRef}
          coverRef={coverRef}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {state.step > 0 ? (
          <button
            type="button"
            onClick={prevStep}
            className={buttonVariants({ size: 'md' })}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            ANTERIOR
          </button>
        ) : (
          <div />
        )}

        {state.step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={!canAdvance}
            className={buttonVariants({ variant: 'accent', size: 'md' })}
          >
            SIGUIENTE
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={state.submitting}
            className={buttonVariants({ variant: 'accent', size: 'md' })}
          >
            {state.uploadingImages ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                SUBIENDO IMÁGENES...
              </>
            ) : state.submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ENVIANDO...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                ENVIAR
              </>
            )}
          </button>
        )}
      </div>
    </form>
  )
}
