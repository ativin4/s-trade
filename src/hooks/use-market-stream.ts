'use client'

import { useEffect, useRef, useState } from 'react'
import type { LtpEntry } from '@/lib/services/market-ltp'

export type { LtpEntry }

export function useMarketStream(symbols: string[], exchange = 'NSE') {
  const [data, setData]   = useState<Record<string, LtpEntry>>({})
  const [stale, setStale] = useState(false)
  const esRef = useRef<EventSource | null>(null)
  const symbolsKey = symbols.join(',')

  useEffect(() => {
    if (!symbols.length) return

    const url = `/api/market/stream?symbols=${encodeURIComponent(symbolsKey)}&exchange=${exchange}`

    const open = () => {
      if (document.hidden) return
      esRef.current?.close()
      const es = new EventSource(url)
      esRef.current = es
      es.onmessage = e => {
        try { setData(JSON.parse(e.data)); setStale(false) } catch { /* ignore */ }
      }
      es.onerror = () => setStale(true)
    }

    const onVisibility = () => {
      if (document.hidden) {
        esRef.current?.close()
        esRef.current = null
      } else {
        open()
      }
    }

    open()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      esRef.current?.close()
      esRef.current = null
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [symbolsKey, exchange])

  return { data, stale }
}
