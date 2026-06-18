import type { AIAnalysisResponse, UserSettings } from '@/app/types'
import { cn } from '@/lib/utils'

interface Props {
  insights: AIAnalysisResponse[]
  userPreferences: UserSettings | null
}

const REC_COLOR: Record<string, string> = {
  BUY:        'text-emerald-400 bg-emerald-950/40 border-emerald-800/50',
  STRONG_BUY: 'text-emerald-300 bg-emerald-950/60 border-emerald-700/50',
  SELL:       'text-red-400 bg-red-950/40 border-red-800/50',
  STRONG_SELL:'text-red-300 bg-red-950/60 border-red-700/50',
  HOLD:       'text-amber-400 bg-amber-950/30 border-amber-800/50',
}

export function AIInsights({ insights }: Props) {
  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <p className="text-xs font-bold text-white uppercase tracking-widest">AI Insights</p>
      </div>

      {insights.length > 0 ? (
        <div className="divide-y divide-slate-800/50">
          {insights.map((ins, i) => (
            <div key={i} className="px-5 py-3.5 hover:bg-slate-800/20 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-bold text-white">{ins.symbol}</p>
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide',
                  REC_COLOR[ins.recommendation] ?? 'text-slate-400 bg-slate-800 border-slate-700'
                )}>
                  {ins.recommendation.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{ins.reasoning}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[11px] text-slate-600">
                  Confidence <span className="text-slate-400">{(ins.confidence * 100).toFixed(0)}%</span>
                </span>
                <span className="text-[11px] text-slate-600">
                  {ins.timeframe}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-slate-600 text-sm">No insights yet</p>
          <p className="text-slate-700 text-xs mt-1">Add holdings to get AI analysis</p>
        </div>
      )}
    </div>
  )
}
