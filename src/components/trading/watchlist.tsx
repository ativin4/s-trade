'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useMarketStream } from '@/hooks/use-market-stream'

const NIFTY50 = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'SBIN',
  'BHARTIARTL', 'KOTAKBANK', 'BAJFINANCE', 'ASIANPAINT', 'AXISBANK', 'MARUTI',
  'LT', 'WIPRO', 'ULTRACEMCO', 'TITAN', 'NESTLEIND', 'TECHM', 'POWERGRID',
  'NTPC', 'SUNPHARMA', 'M&M', 'TATAMOTORS', 'JSWSTEEL',
]

const NIFTY_BANK = [
  'HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'AXISBANK', 'SBIN',
  'INDUSINDBK', 'BANKBARODA', 'FEDERALBNK', 'IDFCFIRSTB', 'BANDHANBNK',
]

const FNO_POPULAR = [
  'NIFTY', 'BANKNIFTY', 'FINNIFTY', 'RELIANCE', 'TCS', 'INFY',
  'HDFCBANK', 'ZOMATO', 'ADANIENT', 'BAJFINANCE', 'TATAMOTORS', 'ONGC',
]

const SECTORS: Record<string, string[]> = {
  'My List': [],
  'Nifty 50': NIFTY50,
  'Bank': NIFTY_BANK,
  'F&O': FNO_POPULAR,
}

type Category = keyof typeof SECTORS

interface WatchlistProps {
  userId: string
  activeSymbol: string
  onSelect: (symbol: string, price?: number) => void
  onBuy?: (symbol: string, price?: number) => void
  onSell?: (symbol: string, price?: number) => void
}

export function Watchlist({ userId, activeSymbol, onSelect, onBuy, onSell }: WatchlistProps) {
  const [category, setCategory] = useState<Category>('Nifty 50')
  const [myList, setMyList] = useState(['RELIANCE', 'TCS', 'HDFCBANK', 'INFY'])
  const [addInput, setAddInput] = useState('')
  const [search, setSearch] = useState('')

  const baseSymbols: string[] = category === 'My List' ? myList : (SECTORS[category] ?? [])
  const symbols = search
    ? baseSymbols.filter(s => s.includes(search.toUpperCase()))
    : baseSymbols

  const { data: prices, stale: priceStale } = useMarketStream(baseSymbols)

  const addToMyList = () => {
    const s = addInput.trim().toUpperCase()
    if (s && !myList.includes(s)) {
      setMyList(prev => [...prev, s])
    }
    setAddInput('')
  }

  const removeFromMyList = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setMyList(prev => prev.filter(s => s !== sym))
  }

  return (
    <div className="flex flex-col bg-[#0f1117] border border-slate-800 rounded-lg overflow-hidden min-h-[480px]">
      {priceStale && (
        <div className="px-2 py-0.5 bg-amber-950/40 border-b border-amber-800/40 text-[10px] text-amber-400 text-center">
          prices stale — market data unavailable
        </div>
      )}
      {/* Category tabs */}
      <div className="flex border-b border-slate-800 bg-[#0d0f14]">
        {(Object.keys(SECTORS) as Category[]).map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'flex-1 py-2 text-[11px] font-semibold tracking-wide transition-colors',
              category === c
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-slate-600 hover:text-slate-400'
            )}
          >
            {c === 'My List' ? 'MY LIST' : c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Search / Add input */}
      <div className="px-2 py-1.5 border-b border-slate-800">
        {category === 'My List' ? (
          <div className="flex gap-1">
            <input
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-600 uppercase focus:outline-none focus:border-blue-600"
              placeholder="Add symbol…"
              value={addInput}
              onChange={e => setAddInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && addToMyList()}
            />
            <button
              onClick={addToMyList}
              className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded font-medium"
            >
              +
            </button>
          </div>
        ) : (
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-600 uppercase focus:outline-none focus:border-blue-600"
            placeholder="Filter…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        )}
      </div>

      {/* Symbol rows */}
      <div className="flex-1 overflow-y-auto">
        {symbols.length === 0 && (
          <div className="text-xs text-slate-600 text-center py-8">
            {category === 'My List' ? 'Add symbols above' : 'No results'}
          </div>
        )}
        {symbols.map(sym => {
          const p = prices[sym]
          const up = (p?.changePercent ?? 0) >= 0
          const isActive = sym === activeSymbol
          return (
            <div
              key={sym}
              className={cn(
                'relative flex items-center border-b border-slate-800/60 transition-colors group',
                isActive
                  ? 'bg-blue-950/40 border-l-2 border-l-blue-500'
                  : 'hover:bg-slate-800/40'
              )}
            >
              {/* Main clickable row */}
              <button
                onClick={() => onSelect(sym, p?.price)}
                className="flex-1 flex items-start justify-between px-3 py-2 text-left"
              >
                {/* Left: symbol + price */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={cn('text-[11px] font-bold uppercase tracking-wide', isActive ? 'text-blue-300' : 'text-slate-400')}>
                      {sym}
                    </span>
                    {category === 'My List' && (
                      <span
                        onClick={e => removeFromMyList(sym, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-[11px] leading-none cursor-pointer"
                      >
                        ×
                      </span>
                    )}
                  </div>
                  <div className={cn('text-[15px] font-bold tabular-nums mt-0.5', isActive ? 'text-white' : 'text-slate-200')}>
                    {p ? `₹${p.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}
                  </div>
                </div>

                {/* Right: % change + abs change */}
                {p && (
                  <div className={cn('text-right flex-shrink-0 ml-2', up ? 'text-emerald-400' : 'text-red-400')}>
                    <div className="text-[13px] font-bold">
                      {up ? '+' : ''}{p.changePercent.toFixed(2)}%
                    </div>
                    <div className="text-[11px] opacity-70 tabular-nums">
                      {up ? '+' : ''}{p.change.toFixed(1)}
                    </div>
                  </div>
                )}
              </button>

              {/* Hover quick B/S */}
              {(onBuy || onSell) && (
                <div className="absolute right-0 top-0 bottom-0 flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-slate-900/90 to-transparent pl-4">
                  {onBuy && (
                    <button
                      onClick={e => { e.stopPropagation(); onBuy(sym, p?.price) }}
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-800/80 hover:bg-emerald-700 text-emerald-300 border border-emerald-700"
                    >
                      B
                    </button>
                  )}
                  {onSell && (
                    <button
                      onClick={e => { e.stopPropagation(); onSell(sym, p?.price) }}
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-900/80 hover:bg-red-800 text-red-300 border border-red-800"
                    >
                      S
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
