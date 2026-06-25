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

export function LivePositions({ initialPositions = [] }: Props) {
  const router = useRouter()
  const [positions, setPositions] = useState<PositionEntry[]>(initialPositions)

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

  const unrealisedTotal = open.reduce((s, p)   => s + (p.unrealisedPnl ?? 0), 0)
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
              const up = (pos.unrealisedPnl ?? 0) >= 0
              return (
                <div key={i} className="flex items-center px-4 py-3 gap-3 active:bg-slate-800/40 cursor-pointer" onClick={() => router.push(`/trade?symbol=${pos.symbol}`)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-[13px]">{pos.symbol}</span>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', pos.side === 'BUY' ? 'bg-emerald-900/60 text-emerald-400' : 'bg-red-900/60 text-red-400')}>{pos.side}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{pos.qty} qty · avg {fmtINR(pos.avgPrice)} · {pos.broker}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-bold text-white tabular-nums">{fmtINR(pos.ltp)}</p>
                    <p className={cn('text-[12px] font-semibold tabular-nums', up ? 'text-emerald-400' : 'text-red-400')}>
                      {fmtChangeINR(pos.unrealisedPnl ?? 0)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: table */}
          <table className="hidden md:table w-full text-[12px]">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800/30">
                <th className="text-left px-5 py-2">Symbol</th>
                <th className="text-left px-5 py-2">Side</th>
                <th className="text-right px-5 py-2">Qty</th>
                <th className="text-right px-5 py-2">Avg</th>
                <th className="text-right px-5 py-2">LTP</th>
                <th className="text-right px-5 py-2">P&L</th>
                <th className="text-left px-5 py-2">Broker</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/25">
              {rows.map((pos, i) => {
                const up = (pos.unrealisedPnl ?? 0) >= 0
                return (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => router.push(`/trade?symbol=${pos.symbol}`)}>
                    <td className="px-5 py-2.5 font-semibold text-slate-200">{pos.symbol}</td>
                    <td className="px-5 py-2.5">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', pos.side === 'BUY' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400')}>
                        {pos.side}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right text-slate-300 tabular-nums">{pos.qty}</td>
                    <td className="px-5 py-2.5 text-right text-slate-500 tabular-nums">{fmtINR(pos.avgPrice)}</td>
                    <td className="px-5 py-2.5 text-right text-white tabular-nums font-medium">{fmtINR(pos.ltp)}</td>
                    <td className={cn('px-5 py-2.5 text-right tabular-nums font-semibold', up ? 'text-emerald-400' : 'text-red-400')}>
                      {fmtChangeINR(pos.unrealisedPnl ?? 0)}
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
