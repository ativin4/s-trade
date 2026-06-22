'use client'

import { useEffect, useRef, useState } from 'react'
import type { LtpEntry } from '@/lib/services/market-ltp'

export type { LtpEntry }

const POLL_MS = 5000

export function useMarketStream(symbols: string[], exchange = 'NSE') {
  const [data, setData]   = useState<Record<string, LtpEntry>>({})
  const [stale, setStale] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const symbolsKey = symbols.join(',')

  useEffect(() => {
    if (!symbols.length) return

    const url = `/api/market/stream?symbols=${encodeURIComponent(symbolsKey)}&exchange=${exchange}`

    const poll = async () => {
      if (document.hidden) return
      try {
        const res = await fetch(url)
        if (!res.ok) { setStale(true); return }
        setData(await res.json())
        setStale(false)
      } catch {
        setStale(true)
      }
    }

    poll()
    timerRef.current = setInterval(poll, POLL_MS)

    const onVisibility = () => {
      if (!document.hidden) poll()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [symbolsKey, exchange])

  return { data, stale }
}
