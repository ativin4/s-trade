import type { AIAnalysisResponse, UserSettings } from '@/app/types'
import { cn } from '@/lib/utils'
import { fmtINR } from '@/lib/format'
import Link from 'next/link'

interface Props {
  insights: AIAnalysisResponse[]
  userPreferences: UserSettings | null
}

const REC_STYLE: Record<string, { text: string; bg: string; dot: string }> = {
  BUY:         { text: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800/50', dot: 'bg-emerald-400' },
  STRONG_BUY:  { text: 'text-emerald-300', bg: 'bg-emerald-950/60 border-emerald-700/50', dot: 'bg-emerald-300' },
  SELL:        { text: 'text-red-400',     bg: 'bg-red-950/40 border-red-800/50',         dot: 'bg-red-400' },
  STRONG_SELL: { text: 'text-red-300',     bg: 'bg-red-950/50 border-red-700/50',         dot: 'bg-red-300' },
  HOLD:        { text: 'text-amber-400',   bg: 'bg-amber-950/30 border-amber-800/50',     dot: 'bg-amber-400' },
}

const HORIZON_SHORT: Record<string, string> = {
  INTRADAY: 'Intraday', SWING: 'Swing', POSITIONAL: 'Positional', LONG_TERM: 'LT',
}

export function AIInsights({ insights }: Props) {
  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <p className="text-xs font-bold text-white uppercase tracking-widest">Trade Ideas</p>
        {insights.length > 0 && (
          <Link href="/insights" className="text-[11px] text-slate-500 hover:text-blue-400 transition-colors">
            View all →
          </Link>
        )}
      </div>

      {insights.length > 0 ? (
        <div className="divide-y divide-slate-800/40">
          {insights.slice(0, 4).map((ins, i) => {
            const s    = REC_STYLE[ins.recommendation] ?? REC_STYLE['HOLD']!
            const conf = Math.min(100, Math.max(0, ins.confidence))
            const up   = ins.upside
            const t1   = ins.target1 ?? ins.targetPrice
            const sl   = ins.stopLoss
            const hor  = ins.horizon ? HORIZON_SHORT[ins.horizon] : ins.timeframe

            return (
              <div key={i} className="px-4 py-3.5 hover:bg-slate-800/20 transition-colors">
                {/* Row 1: symbol + action */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
                    <span className="text-sm font-bold text-white">{ins.symbol}</span>
                    {hor && <span className="text-[9px] text-slate-600 border border-slate-700/50 px-1.5 py-0.5 rounded">{hor}</span>}
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase', s.bg, s.text)}>
                    {ins.recommendation.replace('_', ' ')}
                  </span>
                </div>

                {/* Row 2: Entry → Target / SL */}
                {(t1 || sl) && (
                  <div className="flex items-center gap-3 mb-2 text-[11px]">
                    {t1 && <span className="text-slate-500">T: <span className="text-emerald-400 font-semibold">{fmtINR(t1)}</span></span>}
                    {sl && <span className="text-slate-500">SL: <span className="text-red-400 font-semibold">{fmtINR(sl)}</span></span>}
                    {up != null && (
                      <span className={cn('font-semibold', up >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {up >= 0 ? '+' : ''}{up.toFixed(1)}%
                      </span>
                    )}
                    {ins.riskReward && (
                      <span className="text-slate-600">R:R {ins.riskReward.toFixed(1)}×</span>
                    )}
                  </div>
                )}

                {/* Row 3: thesis or reasoning */}
                {ins.thesis && ins.thesis[0] ? (
                  <p className="text-[11px] text-slate-500 line-clamp-1">• {ins.thesis[0]}</p>
                ) : (
                  <p className="text-[11px] text-slate-500 line-clamp-1">{ins.reasoning}</p>
                )}

                {/* Confidence bar */}
                <div className="mt-2 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', conf >= 70 ? 'bg-emerald-500/60' : conf >= 50 ? 'bg-amber-500/60' : 'bg-red-500/60')}
                    style={{ width: `${conf}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-slate-600 text-sm">No trade ideas yet</p>
          <p className="text-slate-700 text-xs mt-1">Add holdings to generate AI-powered trade ideas</p>
        </div>
      )}
    </div>
  )
}
