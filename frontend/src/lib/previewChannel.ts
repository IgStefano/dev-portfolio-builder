import { useCallback, useEffect, useRef, useState } from 'react'
import type { GeneratedSite, Theme } from '../api/generated'

export type PreviewPayload = {
  site: GeneratedSite
  theme: Theme
}

type PreviewMessage =
  | { type: 'preview:payload'; payload: PreviewPayload }
  | { type: 'preview:request' }

function isPreviewMessage(data: unknown): data is PreviewMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    ((data as PreviewMessage).type === 'preview:payload' ||
      (data as PreviewMessage).type === 'preview:request')
  )
}

/**
 * Hook for the parent frame. Posts the payload to the iframe
 * on load and whenever the payload changes.
 */
export function usePreviewSender(payload: PreviewPayload | null) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const latestPayload = useRef(payload)

  useEffect(() => {
    latestPayload.current = payload
  }, [payload])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!isPreviewMessage(event.data)) return
      if (event.data.type === 'preview:request' && latestPayload.current) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'preview:payload', payload: latestPayload.current } satisfies PreviewMessage,
          '*',
        )
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const sendPayload = useCallback((p: PreviewPayload) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'preview:payload', payload: p } satisfies PreviewMessage,
      '*',
    )
  }, [])

  useEffect(() => {
    if (payload) {
      sendPayload(payload)
    }
  }, [payload, sendPayload])

  const onIframeLoad = useCallback(() => {
    if (latestPayload.current) {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'preview:payload', payload: latestPayload.current } satisfies PreviewMessage,
        '*',
      )
    }
  }, [])

  return { iframeRef, onIframeLoad }
}

/**
 * Hook for the iframe. Requests the payload on mount and
 * listens for updates.
 */
export function usePreviewReceiver() {
  const [payload, setPayload] = useState<PreviewPayload | null>(null)

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!isPreviewMessage(event.data)) return
      if (event.data.type === 'preview:payload') {
        setPayload(event.data.payload)
      }
    }
    window.addEventListener('message', handleMessage)

    // Request initial payload from parent
    window.parent.postMessage({ type: 'preview:request' } satisfies PreviewMessage, '*')

    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return payload
}
