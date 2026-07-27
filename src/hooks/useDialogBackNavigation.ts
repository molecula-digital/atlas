'use client'

import { useCallback, useEffect, useRef } from 'react'

const HISTORY_FLAG = 'dialog'

/**
 * Syncs an open dialog with the browser history stack so the back button closes it.
 * Call `dismiss()` from onOpenChange instead of closing directly to keep history in sync.
 */
export function useDialogBackNavigation(
  isOpen: boolean,
  onClose: () => void,
  options?: {
    /** Return true to consume back without closing (e.g. nested view inside the dialog). */
    onBack?: () => boolean
    /** Optional URL to push when the dialog opens (for shareable deep links). */
    url?: string | null
  },
) {
  const onCloseRef = useRef(onClose)
  const onBackRef = useRef(options?.onBack)
  const urlRef = useRef(options?.url)
  onCloseRef.current = onClose
  onBackRef.current = options?.onBack
  urlRef.current = options?.url

  const dismiss = useCallback(() => {
    if (typeof window !== 'undefined' && history.state?.[HISTORY_FLAG]) {
      history.back()
    } else {
      onCloseRef.current()
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const nextUrl = urlRef.current
    history.pushState(
      { [HISTORY_FLAG]: true },
      '',
      nextUrl ?? undefined,
    )

    const handlePopState = () => {
      if (onBackRef.current?.()) {
        const restoreUrl = urlRef.current
        history.pushState(
          { [HISTORY_FLAG]: true },
          '',
          restoreUrl ?? undefined,
        )
        return
      }
      onCloseRef.current()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isOpen])

  return { dismiss }
}
