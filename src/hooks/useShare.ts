'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface SharePayload {
  title?: string
  text?: string
  url?: string
  /** Text copied when native sharing is unavailable. Defaults to url, text, or title. */
  copyText?: string
}

export type ShareStatus = 'idle' | 'shared' | 'copied' | 'error'
export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

interface UseShareOptions {
  resetAfter?: number
}

type NavigatorWithUAData = Navigator & {
  userAgentData?: { mobile?: boolean }
}

function isMobileDevice(): boolean {
  const navigatorWithUAData = navigator as NavigatorWithUAData

  if (typeof navigatorWithUAData.userAgentData?.mobile === 'boolean') {
    return navigatorWithUAData.userAgentData.mobile
  }

  return (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function canUseNativeShare(payload: ShareData): boolean {
  if (!isMobileDevice() || typeof navigator.share !== 'function') return false

  try {
    return !navigator.canShare || navigator.canShare(payload)
  } catch {
    return false
  }
}

async function copyToClipboard(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // In insecure or restricted contexts, fall through to the DOM fallback.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}

/**
 * Share arbitrary content through the mobile share sheet, with a clipboard
 * fallback for desktop browsers and devices without Web Share support.
 */
export function useShare(
  defaultPayload: SharePayload = {},
  { resetAfter = 2000 }: UseShareOptions = {},
) {
  const [status, setStatus] = useState<ShareStatus>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateStatus = useCallback(
    (nextStatus: ShareStatus) => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
      setStatus(nextStatus)

      if (nextStatus !== 'idle') {
        resetTimer.current = setTimeout(() => {
          setStatus('idle')
          resetTimer.current = null
        }, resetAfter)
      }
    },
    [resetAfter],
  )

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    [],
  )

  const share = useCallback(
    async (payload: SharePayload = {}): Promise<ShareResult> => {
      const data = { ...defaultPayload, ...payload }
      const url = data.url || window.location.href
      const nativePayload: ShareData = {
        title: data.title,
        text: data.text,
        url,
      }

      updateStatus('idle')

      if (canUseNativeShare(nativePayload)) {
        try {
          await navigator.share(nativePayload)
          updateStatus('shared')
          return 'shared'
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return 'cancelled'
          }
          // If the share sheet fails to open, continue to the copy fallback.
        }
      }

      const valueToCopy = data.copyText || url || data.text || data.title
      if (valueToCopy && (await copyToClipboard(valueToCopy))) {
        updateStatus('copied')
        return 'copied'
      }

      updateStatus('error')
      return 'failed'
    },
    [defaultPayload, updateStatus],
  )

  return {
    share,
    status,
    copied: status === 'copied',
    sharing: status === 'shared',
  }
}
