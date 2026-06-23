'use client'

import { useEffect, useMemo, useState } from 'react'
import { AIInsightCard } from '@/components/ai/ai-insight-card'
import { cn } from '@/lib/utils'
import type { AIAnalysisResponse } from '@/app/types'

type ScreenType =
  | 'MOMENTUM_BREAKOUT'
  | 'OVERSOLD_REVERSAL'
  | 'MACD_CROSSOVER'
  | 'VOLUME_SURGE'

interface ScreenResult {
  symbol: string
  screen: ScreenType
  price: number
  change: number
  changePercent: number
  rsi?: number
  volumeRatio?: number
  sma50?: number
}

interface ScreenerResponse {
  ideas: AIAnalysisResponse[]
  screenedAt: string
  screens: ScreenResult[]
}

const SCREEN_META: Record<ScreenType, { label: string; badge: string }> = {
  MOMENTUM_BREAKOUT: { label: 'Momentum Breakout', badge: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30' },
  OVERSOLD_REVERSAL: { label: 'Oversold Reversal', badge: 'text-amber-300 border-amber-500/40 bg-amber-950/30' },
  MACD_CROSSOVER:    { label: 'MACD Crossover',    badge: 'text-blue-300 border-blue-500/40 bg-blue-950/30' },
  VOLUME_SURGE:      { label: 'Volume Surge',      badge: 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-950/30' },
}

type FilterKey = 'ALL' | ScreenType

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL',               label: 'All' },
  { key: 'MOMENTUM_BREAKOUT', label: 'Breakout' },
  { key: 'OVERSOLD_REVERSAL', label: 'Reversal' },
  { key: 'MACD_CROSSOVER',    label: 'MACD' },
  { key: 'VOLUME_SURGE',      label: 'Volume' },
]

function MarketIdeasSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {[1,2,3].map(i => (
        <div key={i} className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 pt-4 pb-3 bg-slate-800/20 flex justify-between">
            <div>
              <div className="h-5 w-20 bg-slate-800 rounded mb-1.5" />
              <div className="h-3 w-32 bg-slate-800/60 rounded" />
            </div>
            <div className="h-5 w-16 bg-slate-700 rounded-full" />
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-800/60 border-t border-slate-800/60">
            {[1,2,3].map(j => (
              <div key={j} className="px-3 py-2.5 text-center space-y-1.5">
                <div className="h-2 w-8 bg-slate-800/60 rounded mx-auto" />
                <div className="h-4 w-14 bg-slate-800 rounded mx-auto" />
              </div>
            ))}
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="h-2 w-full bg-slate-800/50 rounded" />
            <div className="h-2 w-2/3 bg-slate-800/40 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MarketIdeasFeed() {
  const [data, setData] = useState<ScreenerResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('ALL')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/insights/screener')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: ScreenerResponse) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Map symbol → screen type for badge rendering.
  const screenBySymbol = useMemo(() => {
    const map: Record<string, ScreenType> = {}
    for (const s of data?.screens ?? []) {
      if (!map[s.symbol]) map[s.symbol] = s.screen
    }
    return map
  }, [data])

  const visibleIdeas = useMemo(() => {
    const ideas = data?.ideas ?? []
    if (filter === 'ALL') return ideas
    return ideas.filter((idea) => screenBySymbol[idea.symbol] === filter)
  }, [data, filter, screenBySymbol])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <div key={f.key} className="h-7 w-20 bg-slate-800 rounded-full animate-pulse" />
          ))}
        </div>
        <MarketIdeasSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#0f1117] border border-slate-800 rounded-xl px-5 py-10 text-center">
        <p className="text-slate-400 text-sm">Unable to load market ideas</p>
        <p className="text-slate-600 text-xs mt-1">Please refresh and try again.</p>
      </div>
    )
  }

  const hasIdeas = (data?.ideas?.length ?? 0) > 0
  const screenedAt = data?.screenedAt ? new Date(data.screenedAt) : null

  return (
    <div className="space-y-5">
      {/* Filter chips */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                  active
                    ? 'border-blue-500 text-blue-300 bg-blue-950/40'
                    : 'border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>
        {screenedAt && (
          <span className="text-[11px] text-slate-600">
            Screened {screenedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {!hasIdeas ? (
        <div className="bg-[#0f1117] border border-slate-800 rounded-xl px-5 py-12 text-center">
          <p className="text-slate-400 text-sm">No trade ideas right now</p>
          <p className="text-slate-600 text-xs mt-1">
            Screener runs during market hours (9:15 AM - 3:30 PM IST)
          </p>
        </div>
      ) : visibleIdeas.length === 0 ? (
        <div className="bg-[#0f1117] border border-slate-800 rounded-xl px-5 py-10 text-center">
          <p className="text-slate-500 text-sm">No ideas match this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleIdeas.map((idea) => {
            const screen = screenBySymbol[idea.symbol]
            const meta = screen ? SCREEN_META[screen] : null
            return (
              <div key={idea.symbol} className="relative">
                {meta && (
                  <span
                    className={cn(
                      'absolute -top-2 left-3 z-10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border',
                      meta.badge
                    )}
                  >
                    {meta.label}
                  </span>
                )}
                <AIInsightCard analysis={idea} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
