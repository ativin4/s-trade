import type { AIAnalysisResponse } from '@/app/types'
import { cn } from '@/lib/utils'
import { fmtINR } from '@/lib/format'

const REC = {
  BUY:         { label: 'BUY',         border: 'border-emerald-500/40', bg: 'bg-emerald-950/30', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  STRONG_BUY:  { label: 'STRONG BUY',  border: 'border-emerald-400/60', bg: 'bg-emerald-950/50', dot: 'bg-emerald-300', text: 'text-emerald-300' },
  SELL:        { label: 'SELL',         border: 'border-red-500/40',     bg: 'bg-red-950/30',     dot: 'bg-red-400',     text: 'text-red-400' },
  STRONG_SELL: { label: 'STRONG SELL', border: 'border-red-400/60',     bg: 'bg-red-950/50',     dot: 'bg-red-300',     text: 'text-red-300' },
  HOLD:        { label: 'HOLD',         border: 'border-amber-500/40',   bg: 'bg-amber-950/20',   dot: 'bg-amber-400',   text: 'text-amber-400' },
}

const HORIZON_LABEL: Record<string, string> = {
  INTRADAY:   'Intraday',
  SWING:      'Swing',
  POSITIONAL: 'Positional',
  LONG_TERM:  'Long Term',
}

interface Props {
  analysis: AIAnalysisResponse
  onAccept?: () => void
  onReject?: () => void
}

export function AIInsightCard({ analysis }: Props) {
  const rec     = REC[analysis.recommendation] ?? REC.HOLD
  const entry   = analysis.entryMin && analysis.entryMax
    ? `${fmtINR(analysis.entryMin)} – ${fmtINR(analysis.entryMax)}`
    : analysis.entryMin ? fmtINR(analysis.entryMin) : '—'
  const target1 = analysis.target1 ?? analysis.targetPrice
  const sl      = analysis.stopLoss
  const up      = analysis.upside
  const rr      = analysis.riskReward
  const conf    = typeof analysis.confidence === 'number' ? Math.min(100, Math.max(0, analysis.confidence)) : 0
  const horizon = analysis.horizon ? HORIZON_LABEL[analysis.horizon] : null

  return (
    <div className={cn('rounded-xl border bg-[#0c0e13] overflow-hidden', rec.border)}>
      {/* Header */}
      <div className={cn('px-4 pt-4 pb-3 flex items-start justify-between gap-3', rec.bg)}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-white">{analysis.symbol}</span>
            {horizon && (
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border border-slate-700/60 px-1.5 py-0.5 rounded">
                {horizon}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{analysis.reasoning}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', rec.dot)} />
          <span className={cn('text-[11px] font-bold uppercase tracking-wide', rec.text)}>{rec.label}</span>
        </div>
      </div>

      {/* Entry / Target / SL */}
      {(analysis.entryMin || target1 || sl) && (
        <div className="grid grid-cols-3 divide-x divide-slate-800/60 border-t border-slate-800/60">
          <PriceCell label="Entry" value={entry} />
          <PriceCell label="Target" value={target1 ? fmtINR(target1) : '—'} positive />
          <PriceCell label="Stop Loss" value={sl ? fmtINR(sl) : '—'} negative />
        </div>
      )}

      {/* R:R + Upside + Confidence */}
      <div className="px-4 py-3 space-y-2.5">
        {(rr || up) && (
          <div className="flex items-center gap-3 flex-wrap">
            {rr && (
              <span className="text-[11px] text-slate-400">
                R:R <span className="font-bold text-white">{rr.toFixed(1)}×</span>
              </span>
            )}
            {up && (
              <span className="text-[11px] text-slate-400">
                Upside <span className={cn('font-bold', up >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {up >= 0 ? '+' : ''}{up.toFixed(1)}%
                </span>
              </span>
            )}
            <span className="text-[11px] text-slate-600">{analysis.timeframe}</span>
          </div>
        )}

        {/* Thesis bullets */}
        {analysis.thesis && analysis.thesis.length > 0 && (
          <ul className="space-y-1">
            {analysis.thesis.map((t, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className={cn('mt-1 w-1 h-1 rounded-full flex-shrink-0', rec.dot)} />
                <span className="text-[11px] text-slate-400 leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Confidence bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-600 uppercase tracking-wide">Confidence</span>
            <span className="text-[11px] font-semibold text-slate-400">{conf.toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', conf >= 70 ? 'bg-emerald-500' : conf >= 50 ? 'bg-amber-500' : 'bg-red-500')}
              style={{ width: `${conf}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function PriceCell({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="px-3 py-2.5 text-center">
      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">{label}</p>
      <p className={cn('text-[12px] font-bold tabular-nums',
        positive ? 'text-emerald-400' : negative ? 'text-red-400' : 'text-slate-300'
      )}>{value}</p>
    </div>
  )
}
