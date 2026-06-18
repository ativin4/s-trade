'use client'

import { cn } from '@/lib/utils'
import { useMarketStream } from '@/hooks/use-market-stream'

const INDICES = ['NIFTY', 'SENSEX', 'BANKNIFTY'] as const
const LABELS: Record<string, string> = {
  NIFTY:     'NIFTY 50',
  SENSEX:    'SENSEX',
  BANKNIFTY: 'BANK NIFTY',
}

export function IndicesStrip() {
  const { data, stale } = useMarketStream(Array.from(INDICES))

  return (
    <div className="hidden md:flex items-center gap-4 px-4">
      {stale && <span className="text-[10px] text-amber-500 animate-pulse">·</span>}
      {INDICES.map(sym => {
        const d = data[sym]
        const up = (d?.changePercent ?? 0) >= 0
        return (
          <div key={sym} className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500">{LABELS[sym]}</span>
            {d ? (
              <>
                <span className="text-[12px] font-bold tabular-nums text-white">
                  {d.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className={cn('text-[11px] font-semibold tabular-nums', up ? 'text-emerald-400' : 'text-red-400')}>
                  {up ? '+' : ''}{d.changePercent.toFixed(2)}%
                </span>
              </>
            ) : (
              <span className="text-[12px] text-slate-600 animate-pulse">—</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
