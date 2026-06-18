'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { DepthResponse, DepthLevel } from '@/app/api/market/depth/route'

interface Props {
  symbol: string
  exchange?: string
}

export function MarketDepth({ symbol, exchange = 'NSE' }: Props) {
  const [depth, setDepth]     = useState<DepthResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol) return
    let cancelled = false

    const refresh = async () => {
      if (cancelled || document.hidden) return
      try {
        const res = await fetch(`/api/market/depth?symbol=${encodeURIComponent(symbol)}&exchange=${exchange}`)
        if (!res.ok || cancelled) return
        setDepth(await res.json())
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false) }
    }

    setLoading(true)
    setDepth(null)
    refresh()
    const id = setInterval(refresh, 2500)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [symbol, exchange])

  if (loading) {
    return (
      <div className="py-6 text-center text-[11px] text-slate-600 animate-pulse">
        Loading depth…
      </div>
    )
  }

  if (!depth?.available) {
    return (
      <div className="py-6 text-center space-y-1">
        <p className="text-[12px] text-slate-500">Order book unavailable</p>
        <p className="text-[10px] text-slate-700">Connect Groww for live depth</p>
      </div>
    )
  }

  const buyBook  = depth.buyBook.slice(0, 5)
  const sellBook = depth.sellBook.slice(0, 5)
  const allQtys  = [...buyBook, ...sellBook].map(l => l.qty)
  const maxQty   = Math.max(...allQtys, 1)
  const totalBuy  = buyBook.reduce((s, l) => s + l.qty, 0)
  const totalSell = sellBook.reduce((s, l) => s + l.qty, 0)

  return (
    <div className="text-[11px] select-none">
      {/* Column header */}
      <div className="grid grid-cols-[1fr_auto_1fr] text-[9px] text-slate-600 uppercase tracking-wider px-2 py-1.5 border-b border-slate-800">
        <span>Qty</span>
        <span className="text-center px-3">Price | Price</span>
        <span className="text-right">Qty</span>
      </div>

      {/* 5 levels */}
      {Array.from({ length: 5 }).map((_, i) => {
        const buy  = buyBook[i]
        const sell = sellBook[i]
        return (
          <DepthRow key={i} buy={buy} sell={sell} maxQty={maxQty} />
        )
      })}

      {/* Totals + spread */}
      <div className="grid grid-cols-3 px-2 py-1.5 border-t border-slate-800 mt-0.5">
        <span className="text-emerald-400 tabular-nums font-semibold">{totalBuy.toLocaleString()}</span>
        <span className="text-center text-slate-600 text-[10px]">
          {depth.spread != null ? `±${depth.spread.toFixed(2)}` : '—'}
        </span>
        <span className="text-right text-red-400 tabular-nums font-semibold">{totalSell.toLocaleString()}</span>
      </div>
    </div>
  )
}

function DepthRow({ buy, sell, maxQty }: { buy?: DepthLevel; sell?: DepthLevel; maxQty: number }) {
  const buyPct  = buy  ? (buy.qty  / maxQty) * 100 : 0
  const sellPct = sell ? (sell.qty / maxQty) * 100 : 0

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center px-2 py-[3px] hover:bg-slate-800/20 transition-colors">
      {/* Buy qty + bar */}
      <div className="relative flex items-center">
        <div
          className="absolute inset-y-0 right-0 bg-emerald-900/25 rounded-sm"
          style={{ width: `${buyPct}%` }}
        />
        <span className={cn('relative tabular-nums', buy ? 'text-emerald-400' : 'text-slate-700')}>
          {buy ? buy.qty.toLocaleString() : '—'}
        </span>
      </div>

      {/* Prices */}
      <div className="flex items-center gap-1 px-2 tabular-nums text-[10px] whitespace-nowrap">
        <span className={buy ? 'text-emerald-400/80' : 'text-slate-700'}>
          {buy ? buy.price.toFixed(2) : '—'}
        </span>
        <span className="text-slate-700">|</span>
        <span className={sell ? 'text-red-400/80' : 'text-slate-700'}>
          {sell ? sell.price.toFixed(2) : '—'}
        </span>
      </div>

      {/* Sell qty + bar */}
      <div className="relative flex items-center justify-end">
        <div
          className="absolute inset-y-0 left-0 bg-red-900/25 rounded-sm"
          style={{ width: `${sellPct}%` }}
        />
        <span className={cn('relative tabular-nums', sell ? 'text-red-400' : 'text-slate-700')}>
          {sell ? sell.qty.toLocaleString() : '—'}
        </span>
      </div>
    </div>
  )
}
