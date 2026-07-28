'use client'

import { useState, useCallback } from 'react'

export type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error'

interface UseFormSubmissionOptions<TResult> {
  /** Turns a thrown value into the message shown to the user. */
  getErrorMessage?: (error: unknown) => string
  onSuccess?: (result: TResult) => void | Promise<void>
  onError?: (error: unknown) => void
}

/**
 * The start/success/error/finish bookkeeping every form in the app was
 * repeating. It knows nothing about HTTP, routing, or messaging — each form
 * keeps its own fetch, payload, and response parsing, and hangs anything that
 * should follow a save off onSuccess.
 */
export function useFormSubmission<TResult = void>({
  getErrorMessage,
  onSuccess,
  onError,
}: UseFormSubmissionOptions<TResult> = {}) {
  const [status, setStatus] = useState<SubmissionStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
  }, [])

  const run = useCallback(
    async (operation: () => Promise<TResult>): Promise<TResult | undefined> => {
      setStatus('submitting')
      setError(null)
      try {
        const result = await operation()
        setStatus('success')
        await onSuccess?.(result)
        return result
      } catch (err) {
        setStatus('error')
        setError(
          getErrorMessage?.(err) ??
            (err instanceof Error ? err.message : 'Algo salió mal'),
        )
        onError?.(err)
        return undefined
      }
    },
    [getErrorMessage, onSuccess, onError],
  )

  return {
    status,
    submitting: status === 'submitting',
    succeeded: status === 'success',
    error,
    run,
    reset,
    /** Escape hatch for validation that fails before any request is made. */
    fail: useCallback((message: string) => {
      setStatus('error')
      setError(message)
    }, []),
  }
}
