import type { PortfolioHolding, AIAnalysisResponse } from '@/app/types'
import { getSector } from '@/lib/sector-map'

interface PortfolioAnalysisProps {
  holdings: PortfolioHolding[]
  analyses: AIAnalysisResponse[]
}

// Per-sector bar colours. Falls back to slate for anything unmapped.
const SECTOR_COLOR: Record<string, string> = {
  Banking: 'bg-blue-500',
  IT: 'bg-emerald-500',
  Energy: 'bg-orange-500',
  FMCG: 'bg-amber-500',
  Auto: 'bg-rose-500',
  Pharma: 'bg-teal-500',
  Telecom: 'bg-violet-500',
  Infra: 'bg-cyan-500',
  NBFC: 'bg-indigo-500',
  Power: 'bg-yellow-500',
  Consumer: 'bg-pink-500',
  Metals: 'bg-slate-400',
  Cement: 'bg-stone-400',
  Other: 'bg-slate-600',
}

interface SectorRow {
  sector: string
  value: number
  percent: number
  topHolding: { symbol: string; value: number } | null
}

function buildSectorRows(holdings: PortfolioHolding[]): { rows: SectorRow[]; total: number } {
  const total = holdings.reduce((s, h) => s + h.marketValue, 0)

  const bySector = new Map<string, { value: number; top: { symbol: string; value: number } | null }>()
  for (const h of holdings) {
    const sector = getSector(h.symbol)
    const entry = bySector.get(sector) ?? { value: 0, top: null }
    entry.value += h.marketValue
    if (!entry.top || h.marketValue > entry.top.value) {
      entry.top = { symbol: h.symbol, value: h.marketValue }
    }
    bySector.set(sector, entry)
  }

  const rows: SectorRow[] = [...bySector.entries()]
    .map(([sector, { value, top }]) => ({
      sector,
      value,
      percent: total > 0 ? (value / total) * 100 : 0,
      topHolding: top,
    }))
    .sort((a, b) => b.value - a.value)

  return { rows, total }
}

const inr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export function PortfolioAnalysis({ holdings, analyses }: PortfolioAnalysisProps) {
  const { rows, total } = buildSectorRows(holdings)
  const buys = analyses.filter(a => a.recommendation === 'BUY' || a.recommendation === 'STRONG_BUY').length

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Holdings', value: holdings.length, color: 'text-white' },
          { label: 'Sectors', value: rows.length, color: 'text-white' },
          { label: 'Total Value', value: inr(total), color: 'text-blue-400' },
          { label: 'AI Buy Calls', value: buys, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0f1117] border border-slate-800 rounded-xl px-5 py-4">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sector breakdown */}
      <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <p className="text-xs font-bold text-white uppercase tracking-widest">Sector Allocation</p>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-slate-600 text-sm">No holdings to analyse</p>
            <p className="text-slate-700 text-xs mt-1">Add holdings to your portfolio to see sector breakdown</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/50">
            {rows.map(row => (
              <li key={row.sector} className="px-5 py-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-sm ${SECTOR_COLOR[row.sector] ?? SECTOR_COLOR.Other}`}
                    />
                    <span className="text-sm font-semibold text-white">{row.sector}</span>
                    <span className="text-[11px] text-slate-600 tabular-nums">{row.percent.toFixed(1)}%</span>
                  </div>
                  <span className="text-sm font-medium text-slate-300 tabular-nums">{inr(row.value)}</span>
                </div>

                {/* % bar */}
                <div className="h-2 w-full bg-slate-800/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${SECTOR_COLOR[row.sector] ?? SECTOR_COLOR.Other}`}
                    style={{ width: `${Math.max(row.percent, 2)}%` }}
                  />
                </div>

                {row.topHolding && (
                  <p className="text-[11px] text-slate-600 mt-1.5">
                    Top: <span className="text-slate-400">{row.topHolding.symbol}</span> · {inr(row.topHolding.value)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
