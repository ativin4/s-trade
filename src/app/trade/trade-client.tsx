'use client'

import { useState, useEffect } from 'react'
import { Watchlist } from '@/components/trading/watchlist'
import { StockChart } from '@/components/trading/stock-chart'
import { TradingPanel } from '@/components/trading/trading-panel'
import { cn } from '@/lib/utils'
import { fmtINR, fmtChangeINR } from '@/lib/format'
import { PRODUCT_LABEL } from '@/lib/broker-constants'
import type { BrokerAccount, Trade, UserSettings } from '@/app/types'
import type { PositionEntry } from '@/app/api/market/positions/route'
import type { OrderEntry } from '@/app/api/market/orders/route'

interface TradeClientProps {
  userId: string
  brokerAccounts: BrokerAccount[]
  recentTrades: (Trade & { brokerAccount: { brokerName: string } })[]
  userSettings: UserSettings | null
  initialSymbol?: string
}

type BottomTab = 'history' | 'positions' | 'orders'

const BOTTOM_TABS: { id: BottomTab; label: string }[] = [
  { id: 'history',   label: 'HISTORY'   },
  { id: 'positions', label: 'POSITIONS' },
  { id: 'orders',    label: 'ORDERS'    },
]

const TRADE_STATUS_CLASSES: Record<string, string> = {
  EXECUTED:  'bg-emerald-900/60 text-emerald-400',
  PENDING:   'bg-yellow-900/60 text-yellow-400',
  CANCELLED: 'bg-slate-800 text-slate-500',
  REJECTED:  'bg-red-900/60 text-red-400',
}

export function TradeClient({ userId, brokerAccounts, recentTrades, userSettings, initialSymbol }: TradeClientProps) {
  const [activeSymbol, setActiveSymbol] = useState(initialSymbol || 'RELIANCE')
  const [activeLtp, setActiveLtp]       = useState<number | undefined>()
  const [activeSide, setActiveSide]     = useState<'BUY' | 'SELL'>('BUY')
  const [bottomTab, setBottomTab]       = useState<BottomTab>('history')
  const [positions, setPositions]   = useState<PositionEntry[]>([])
  const [orders, setOrders]         = useState<OrderEntry[]>([])
  const [posLoading, setPosLoading] = useState(false)
  const [ordLoading, setOrdLoading] = useState(false)

  const orderMarkers = recentTrades
    .filter(t => t.status === 'EXECUTED' || t.status === 'PENDING')
    .map(t => ({
      price:  t.price,
      type:   t.tradeType as 'BUY' | 'SELL',
      symbol: t.symbol,
      qty:    t.quantity,
      time:   new Date(t.createdAt).getTime(),
    }))

  useEffect(() => {
    if (bottomTab !== 'positions') return
    let cancelled = false
    const handler = async () => {
      if (cancelled || document.hidden) return
      setPosLoading(true)
      try {
        const res = await fetch('/api/market/positions')
        if (!res.ok || cancelled) return
        setPositions(await res.json())
      } catch { /* silent */ }
      finally { if (!cancelled) setPosLoading(false) }
    }
    handler()
    const id = setInterval(handler, 5000)
    document.addEventListener('visibilitychange', handler)
    return () => { cancelled = true; clearInterval(id); document.removeEventListener('visibilitychange', handler) }
  }, [bottomTab])

  useEffect(() => {
    if (bottomTab !== 'orders') return
    let cancelled = false
    const handler = async () => {
      if (cancelled || document.hidden) return
      setOrdLoading(true)
      try {
        const res = await fetch('/api/market/orders')
        if (!res.ok || cancelled) return
        setOrders(await res.json())
      } catch { /* silent */ }
      finally { if (!cancelled) setOrdLoading(false) }
    }
    handler()
    const id = setInterval(handler, 10000)
    document.addEventListener('visibilitychange', handler)
    return () => { cancelled = true; clearInterval(id); document.removeEventListener('visibilitychange', handler) }
  }, [bottomTab])

  const openPositions   = positions.filter(p => p.qty > 0)
  const closedPositions = positions.filter(p => p.qty === 0 && p.realisedPnl !== 0)
  // Net M2M = price movement minus MTF interest charges
  const unrealisedTotal = openPositions.reduce((s, p)   => s + (p.unrealisedPnl ?? 0) - (p.mtfInterest ?? 0), 0)
  const realisedTotal   = closedPositions.reduce((s, p) => s + p.realisedPnl, 0)
  const totalPnl        = unrealisedTotal + realisedTotal
  const totalPnlUp      = totalPnl >= 0

  return (
    <div className="flex flex-col gap-3">
      {/* 3-column workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_256px] gap-3">
        <div className="order-3 lg:order-none lg:contents">
          <Watchlist
            userId={userId}
            activeSymbol={activeSymbol}
            onSelect={(sym, price) => { setActiveSymbol(sym); setActiveLtp(price) }}
            onBuy={(sym, price)   => { setActiveSymbol(sym); setActiveLtp(price); setActiveSide('BUY') }}
            onSell={(sym, price)  => { setActiveSymbol(sym); setActiveLtp(price); setActiveSide('SELL') }}
          />
        </div>

        <div className="order-1 lg:order-none lg:contents">
          <StockChart symbol={activeSymbol} orderMarkers={orderMarkers} />
        </div>

        <div className="order-2 lg:order-none lg:contents">
          <TradingPanel
            brokerAccounts={brokerAccounts}
            userSettings={userSettings}
            symbol={activeSymbol}
            defaultSide={activeSide}
            ltp={activeLtp}
          />
        </div>
      </div>

      {/* Bottom strip */}
      <div className="bg-[#0f1117] border border-slate-800 rounded-lg overflow-hidden">
        <div className="flex border-b border-slate-800 bg-[#0d0f14]">
          {BOTTOM_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setBottomTab(id)}
              className={cn(
                'px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2',
                bottomTab === id
                  ? 'text-blue-400 border-blue-500'
                  : 'text-slate-600 border-transparent hover:text-slate-400'
              )}
            >
              {label}
            </button>
          ))}
          <div className="flex-1" />
          {bottomTab === 'history' && (
            <span className="text-[11px] text-slate-600 self-center pr-3">{recentTrades.length} trades</span>
          )}
          {bottomTab === 'orders' && orders.length > 0 && (
            <span className="text-[11px] text-slate-600 self-center pr-3">{orders.length} orders</span>
          )}
          {bottomTab === 'positions' && positions.length > 0 && (
            <div className="flex items-center gap-3 self-center pr-3 text-[11px] font-semibold tabular-nums">
              {openPositions.length > 0 && (
                <span className={unrealisedTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  M2M {fmtChangeINR(unrealisedTotal)}
                </span>
              )}
              {closedPositions.length > 0 && (
                <span className={realisedTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  P&L {fmtChangeINR(realisedTotal)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Trade history */}
        {bottomTab === 'history' && (
          <div className="overflow-x-auto max-h-44 overflow-y-auto">
            {recentTrades.length === 0 ? (
              <div className="text-xs text-slate-600 text-center py-6">No trades yet</div>
            ) : (
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-[#0d0f14]">
                  <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
                    <th className="text-left px-3 py-2">Time</th>
                    <th className="text-left px-3 py-2">Symbol</th>
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="text-right px-3 py-2">Qty</th>
                    <th className="text-right px-3 py-2">Price</th>
                    <th className="text-right px-3 py-2">Value</th>
                    <th className="text-left px-3 py-2">Broker</th>
                    <th className="text-left px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map(trade => (
                    <tr key={trade.id} className="border-t border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                      <td className="px-3 py-1.5 text-slate-500">
                        {new Date(trade.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-3 py-1.5 font-semibold text-slate-200">{trade.symbol}</td>
                      <td className="px-3 py-1.5">
                        <span className={cn('font-bold', trade.tradeType === 'BUY' ? 'text-emerald-400' : 'text-red-400')}>
                          {trade.tradeType}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right text-slate-300">{trade.quantity}</td>
                      <td className="px-3 py-1.5 text-right text-slate-300">{fmtINR(trade.price)}</td>
                      <td className="px-3 py-1.5 text-right text-slate-400">
                        {fmtINR(trade.quantity * trade.price)}
                      </td>
                      <td className="px-3 py-1.5 text-slate-500 capitalize">{trade.brokerAccount.brokerName}</td>
                      <td className="px-3 py-1.5">
                        <span className={cn(
                          'text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded',
                          TRADE_STATUS_CLASSES[trade.status] ?? 'bg-red-900/60 text-red-400'
                        )}>
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Live positions */}
        {bottomTab === 'positions' && (
          <div className="overflow-x-auto max-h-44 overflow-y-auto">
            {posLoading && positions.length === 0 ? (
              <div className="text-xs text-slate-600 text-center py-6 animate-pulse">Loading positions…</div>
            ) : positions.length === 0 ? (
              <div className="text-xs text-slate-600 text-center py-6">No positions today</div>
            ) : (
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-[#0d0f14]">
                  <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
                    <th className="text-left px-3 py-2">Symbol</th>
                    <th className="text-left px-3 py-2">Side</th>
                    <th className="text-right px-3 py-2">Qty</th>
                    <th className="text-right px-3 py-2">Avg</th>
                    <th className="text-right px-3 py-2">LTP</th>
                    <th className="text-right px-3 py-2">Unrealised</th>
                    <th className="text-right px-3 py-2">Realised</th>
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="text-left px-3 py-2">Broker</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos, i) => {
                    const unrealised  = pos.unrealisedPnl ?? 0
                    const realised    = pos.realisedPnl ?? 0
                    const isOpen      = pos.qty > 0
                    const mtfInterest = pos.mtfInterest ?? 0
                    const isMtf       = pos.product === 'MTF'
                    // For MTF, net P&L = price movement minus interest charges
                    const netUnreal   = isMtf ? unrealised - mtfInterest : unrealised
                    return (
                      <tr
                        key={i}
                        className={cn(
                          'border-t border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-pointer',
                          !isOpen && 'opacity-60'
                        )}
                        onClick={() => setActiveSymbol(pos.symbol)}
                      >
                        <td className="px-3 py-1.5 font-semibold text-slate-200">{pos.symbol}</td>
                        <td className="px-3 py-1.5">
                          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', pos.side === 'BUY' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400')}>
                            {pos.side}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-300 tabular-nums">{pos.qty}</td>
                        <td className="px-3 py-1.5 text-right text-slate-400 tabular-nums">
                          {pos.avgPrice > 0 ? fmtINR(pos.avgPrice) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-200 tabular-nums font-medium">{pos.ltp > 0 ? fmtINR(pos.ltp) : '—'}</td>
                        <td className={cn('px-3 py-1.5 text-right tabular-nums font-semibold', netUnreal >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {isOpen ? (
                            pos.avgPrice > 0 ? (
                              <>
                                {fmtChangeINR(netUnreal)}
                                {isMtf && mtfInterest > 0 && (
                                  <span className="block text-[10px] font-normal text-red-400/80">
                                    MTF int: ₹{mtfInterest.toFixed(0)}
                                  </span>
                                )}
                                {isMtf && mtfInterest === 0 && (
                                  <span className="block text-[10px] font-normal text-amber-500/70">
                                    ~18% p.a. interest accrues
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-600 text-[10px]">sync needed</span>
                            )
                          ) : '—'}
                        </td>
                        <td className={cn('px-3 py-1.5 text-right tabular-nums font-semibold', realised >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {realised !== 0 ? fmtChangeINR(realised) : '—'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-500 text-[10px]">{PRODUCT_LABEL[pos.product] ?? pos.product}</td>
                        <td className="px-3 py-1.5 text-slate-500 capitalize">{pos.broker}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Orders tab */}
        {bottomTab === 'orders' && (
          <div className="overflow-x-auto max-h-44 overflow-y-auto">
            {ordLoading && orders.length === 0 ? (
              <div className="text-xs text-slate-600 text-center py-6 animate-pulse">Loading orders…</div>
            ) : orders.length === 0 ? (
              <div className="text-xs text-slate-600 text-center py-6">No orders today</div>
            ) : (
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-[#0d0f14]">
                  <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
                    <th className="text-left px-3 py-2">Symbol</th>
                    <th className="text-left px-3 py-2">Side</th>
                    <th className="text-right px-3 py-2">Qty</th>
                    <th className="text-right px-3 py-2">Price</th>
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Product</th>
                    <th className="text-left px-3 py-2">Broker</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr
                      key={o.orderId}
                      className="border-t border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => setActiveSymbol(o.symbol)}
                    >
                      <td className="px-3 py-1.5 font-semibold text-slate-200">{o.symbol}</td>
                      <td className="px-3 py-1.5">
                        <span className={cn('font-bold', o.side === 'BUY' ? 'text-emerald-400' : 'text-red-400')}>
                          {o.side}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right text-slate-300 tabular-nums">{o.qty}</td>
                      <td className="px-3 py-1.5 text-right text-slate-400 tabular-nums">
                        {o.price > 0 ? fmtINR(o.price) : 'MKT'}
                      </td>
                      <td className="px-3 py-1.5 text-slate-500 text-[10px]">{o.type}</td>
                      <td className="px-3 py-1.5">
                        <span className={cn(
                          'text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded',
                          TRADE_STATUS_CLASSES[o.status] ?? 'bg-slate-800 text-slate-400'
                        )}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-slate-500 text-[10px]">{o.product}</td>
                      <td className="px-3 py-1.5 text-slate-500 capitalize">{o.broker}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
