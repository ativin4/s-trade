'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { fmtINR, fmtChangeINR } from '@/lib/format'
import { PRODUCT, PRODUCT_LABEL } from '@/lib/broker-constants'
import type { PositionEntry } from '@/app/api/market/positions/route'

interface Props {
  initialPositions?: PositionEntry[]
}

// Net unrealised P&L = price movement minus MTF interest (MTF positions only)
function netUnrealised(p: PositionEntry): number {
  const unrealised = p.unrealisedPnl ?? 0
  return p.product === 'MTF' ? unrealised - (p.mtfInterest ?? 0) : unrealised
}

export function LivePositions({ initialPositions = [] }: Props) {
  const router = useRouter()
  const [positions, setPositions] = useState<PositionEntry[]>(initialPositions)
  
  type SortField = 'Symbol' | 'Side' | 'Qty' | 'Avg' | 'LTP' | 'P&L' | 'Broker'
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortAsc) setSortAsc(false)
      else setSortField(null)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  useEffect(() => {
    let skipFirst = initialPositions.length > 0
    let cancelled = false

    const refresh = async () => {
      if (cancelled || document.hidden) return
      if (skipFirst) { skipFirst = false; return }
      try {
        const res = await fetch('/api/market/positions')
        if (!res.ok || cancelled) return
        setPositions(await res.json())
      } catch { /* silent */ }
    }

    const id = setInterval(refresh, 8000)
    document.addEventListener('visibilitychange', refresh)
    return () => { cancelled = true; clearInterval(id); document.removeEventListener('visibilitychange', refresh) }
  }, [])

  const real   = positions.filter(p => !p.paper)
  const open   = real.filter(p => p.qty > 0)
  const closed = real.filter(p => p.qty === 0 && p.realisedPnl !== 0)

  if (open.length === 0 && closed.length === 0) return null

  // Net M2M = price movement minus MTF interest charges
  const unrealisedTotal = open.reduce((s, p)   => s + (p.unrealisedPnl ?? 0) - (p.mtfInterest ?? 0), 0)
  const realisedTotal   = closed.reduce((s, p) => s + p.realisedPnl, 0)

  // Group open positions by product type
  const groups = [PRODUCT.MIS, PRODUCT.MTF, PRODUCT.CNC, PRODUCT.NRML].flatMap(prod => {
    const rows = open.filter(p => p.product === prod || (prod === PRODUCT.MIS && !Object.values(PRODUCT).includes(p.product as any)))
    return rows.length > 0 ? [{ prod, rows }] : []
  })

  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden">
      {/* Summary bar — mirrors Groww's top row */}
      <div className="flex items-center gap-6 px-5 py-3.5 border-b border-slate-800">
        <p className="text-xs font-bold text-white uppercase tracking-widest flex-shrink-0">Positions</p>

        <div className="flex items-center gap-6 text-[12px]">
          <Metric label="Open M2M" value={unrealisedTotal} />
          {closed.length > 0 && <Metric label="Realised" value={realisedTotal} />}
          <span className="text-slate-700">|</span>
          <span className="text-slate-500">{open.length} open{closed.length > 0 ? ` · ${closed.length} closed` : ''}</span>
        </div>

        <Link href="/trade" className="ml-auto text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
          trade →
        </Link>
      </div>

      {/* Open positions */}
      {groups.map(({ prod, rows }) => (
        <div key={prod}>
          {groups.length > 1 && (
            <div className="px-4 py-1.5 flex items-center gap-2 bg-slate-900/30 border-b border-slate-800/40">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{PRODUCT_LABEL[prod] ?? prod}</span>
              <span className="text-[10px] text-slate-700">{rows.length} pos</span>
            </div>
          )}

          {/* Mobile: compact rows */}
          <div className="md:hidden divide-y divide-slate-800/25">
            {rows.map((pos, i) => {
              const mtfInterest = pos.mtfInterest ?? 0
              const isMtf       = pos.product === 'MTF'
              const netUnreal   = isMtf ? (pos.unrealisedPnl ?? 0) - mtfInterest : (pos.unrealisedPnl ?? 0)
              const up = netUnreal >= 0
              return (
                <div key={i} className="flex items-center px-4 py-3 gap-3 active:bg-slate-800/40 cursor-pointer" onClick={() => router.push(`/trade?symbol=${pos.symbol}`)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-[13px]">{pos.symbol}</span>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', pos.side === 'BUY' ? 'bg-emerald-900/60 text-emerald-400' : 'bg-red-900/60 text-red-400')}>{pos.side}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {pos.qty} qty · avg {pos.avgPrice > 0 ? fmtINR(pos.avgPrice) : '—'} · {pos.broker}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-bold text-white tabular-nums">{pos.ltp > 0 ? fmtINR(pos.ltp) : '—'}</p>
                    <p className={cn('text-[12px] font-semibold tabular-nums', up ? 'text-emerald-400' : 'text-red-400')}>
                      {pos.avgPrice > 0 ? fmtChangeINR(netUnreal) : <span className="text-slate-600 text-[10px]">sync needed</span>}
                    </p>
                    {isMtf && mtfInterest > 0 && (
                      <p className="text-[10px] text-red-400/80 tabular-nums">MTF int: ₹{mtfInterest.toFixed(0)}</p>
                    )}
                    {isMtf && pos.avgPrice === 0 && (
                      <p className="text-[10px] text-amber-600/70">~18% p.a. interest</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <table className="hidden md:table w-full text-[12px]">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800/30">
                {(['Symbol', 'Side', 'Qty', 'Avg', 'LTP', 'P&L', 'Broker'] as const).map(h => (
                  <th 
                    key={h}
                    onClick={() => handleSort(h)}
                    className={cn("px-5 py-2 cursor-pointer hover:text-slate-300 select-none group", 
                      ['Qty', 'Avg', 'LTP', 'P&L'].includes(h) ? "text-right" : "text-left"
                    )}
                  >
                    <div className={cn("flex items-center gap-1", ['Qty', 'Avg', 'LTP', 'P&L'].includes(h) && "justify-end")}>
                      {h}
                      <span className={cn("text-[9px] transition-opacity", sortField === h ? "opacity-100 text-white" : "opacity-0 group-hover:opacity-50")}>
                        {sortField === h && !sortAsc ? '▼' : '▲'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/25">
              {[...rows].sort((a, b) => {
                if (!sortField) return 0
                let diff = 0
                switch (sortField) {
                  case 'Symbol': diff = a.symbol.localeCompare(b.symbol); break;
                  case 'Side': diff = a.side.localeCompare(b.side); break;
                  case 'Qty': diff = a.qty - b.qty; break;
                  case 'Avg': diff = a.avgPrice - b.avgPrice; break;
                  case 'LTP': diff = a.ltp - b.ltp; break;
                  case 'P&L': diff = netUnrealised(a) - netUnrealised(b); break;
                  case 'Broker': diff = a.broker.localeCompare(b.broker); break;
                }
                return sortAsc ? diff : -diff
              }).map((pos, i) => {
                const mtfInterest = pos.mtfInterest ?? 0
                const isMtf       = pos.product === 'MTF'
                const netUnreal   = netUnrealised(pos)
                const up = netUnreal >= 0
                return (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => router.push(`/trade?symbol=${pos.symbol}`)}>
                    <td className="px-5 py-2.5 font-semibold text-slate-200">{pos.symbol}</td>
                    <td className="px-5 py-2.5">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', pos.side === 'BUY' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400')}>
                        {pos.side}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right text-slate-300 tabular-nums">{pos.qty}</td>
                    <td className="px-5 py-2.5 text-right text-slate-500 tabular-nums">
                      {pos.avgPrice > 0 ? fmtINR(pos.avgPrice) : <span className="text-slate-700">—</span>}
                    </td>
                    <td className="px-5 py-2.5 text-right text-white tabular-nums font-medium">{pos.ltp > 0 ? fmtINR(pos.ltp) : '—'}</td>
                    <td className={cn('px-5 py-2.5 text-right tabular-nums font-semibold', up ? 'text-emerald-400' : 'text-red-400')}>
                      {pos.avgPrice > 0 ? (
                        <>
                          {fmtChangeINR(netUnreal)}
                          {isMtf && mtfInterest > 0 && (
                            <span className="block text-[10px] font-normal text-red-400/80">MTF int: ₹{mtfInterest.toFixed(0)}</span>
                          )}
                          {isMtf && mtfInterest === 0 && (
                            <span className="block text-[10px] font-normal text-amber-500/70">~18% p.a. interest</span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-600 text-[10px] font-normal">sync needed</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-slate-600 capitalize text-[11px]">{pos.broker}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}

      {/* Closed / squared-off positions */}
      {closed.length > 0 && (
        <div className="border-t border-slate-800/60">
          <div className="px-5 py-1.5 bg-slate-900/30 border-b border-slate-800/40">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Squared Off</span>
          </div>
          <table className="w-full text-[12px]">
            <tbody className="divide-y divide-slate-800/25">
              {closed.map((pos, i) => {
                const up = pos.realisedPnl >= 0
                return (
                  <tr key={i} className="hover:bg-slate-800/25 transition-colors">
                    <td className="px-5 py-2 font-medium text-slate-400 w-40">{pos.symbol}</td>
                    <td className="px-5 py-2 text-[11px] text-slate-600">
                      {PRODUCT_LABEL[pos.product] ?? pos.product} · {pos.broker}
                    </td>
                    <td className={cn('px-5 py-2 text-right tabular-nums font-semibold text-[13px]', up ? 'text-emerald-400' : 'text-red-400')}>
                      {fmtChangeINR(pos.realisedPnl)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  const up = value >= 0
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-500">{label}</span>
      <span className={cn('font-semibold tabular-nums', up ? 'text-emerald-400' : 'text-red-400')}>
        {fmtChangeINR(value)}
      </span>
    </div>
  )
}
