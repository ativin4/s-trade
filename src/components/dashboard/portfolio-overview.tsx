'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PortfolioHolding, BrokerAccount } from '@/app/types'
import { cn } from '@/lib/utils'
import { fmtINR, fmtChangeINR } from '@/lib/format'
import { LivePositions } from '@/components/dashboard/live-positions'

interface Props {
  holdings: PortfolioHolding[]
  brokerAccounts: BrokerAccount[]
}

const TABLE_COLS = ['Symbol', 'Qty', 'Avg', 'LTP', 'Day Chg', 'Value', 'P&L', 'Broker'] as const

export function PortfolioOverview({ holdings, brokerAccounts }: Props) {
  const router = useRouter()
  const [activeBroker, setActiveBroker] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'holdings' | 'positions'>('holdings')

  const brokerMap = Object.fromEntries(brokerAccounts.map(a => [a.id, a.brokerName]))

  const visible = activeBroker
    ? holdings.filter(h => brokerMap[h.brokerAccountId] === activeBroker)
    : holdings

  type SortField = typeof TABLE_COLS[number]
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

  const sortedHoldings = [...visible].sort((a, b) => {
    if (!sortField) return 0
    let diff = 0
    switch (sortField) {
      case 'Symbol': diff = a.symbol.localeCompare(b.symbol); break;
      case 'Qty': diff = a.quantity - b.quantity; break;
      case 'Avg': diff = a.avgPrice - b.avgPrice; break;
      case 'LTP': diff = a.currentPrice - b.currentPrice; break;
      case 'Day Chg': diff = (a.change * a.quantity) - (b.change * b.quantity); break;
      case 'Value': diff = a.marketValue - b.marketValue; break;
      case 'P&L': diff = a.gainLoss - b.gainLoss; break;
      case 'Broker': diff = (brokerMap[a.brokerAccountId] || '').localeCompare(brokerMap[b.brokerAccountId] || ''); break;
    }
    return sortAsc ? diff : -diff
  })

  const { totalValue, totalDailyChange, totalGainLoss } = visible.reduce(
    (acc, h) => ({
      totalValue:       acc.totalValue       + h.marketValue,
      totalDailyChange: acc.totalDailyChange + h.change * h.quantity,
      totalGainLoss:    acc.totalGainLoss    + h.gainLoss,
    }),
    { totalValue: 0, totalDailyChange: 0, totalGainLoss: 0 }
  )
  const dailyPct = totalValue > 0 ? (totalDailyChange / (totalValue - totalDailyChange)) * 100 : 0

  const brokerRows = brokerAccounts.map(acc => {
    const sub   = holdings.filter(h => h.brokerAccountId === acc.id)
    const value = sub.reduce((s, h) => s + h.marketValue, 0)
    return { ...acc, count: sub.length, value }
  }).filter(b => b.count > 0)

  // unique broker names from holdings
  const activeBrokers = [...new Set(
    holdings.map(h => brokerMap[h.brokerAccountId]).filter(b => b != null) as string[]
  )]

  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-800">
        <Stat label="Portfolio Value" value={fmtINR(totalValue)} />
        <Stat
          label="Today"
          value={fmtChangeINR(totalDailyChange)}
          sub={`${dailyPct >= 0 ? '+' : ''}${dailyPct.toFixed(2)}%`}
          positive={totalDailyChange >= 0}
        />
        <Stat label="Total P&L" value={fmtChangeINR(totalGainLoss)} positive={totalGainLoss >= 0} />
        <Stat label="Holdings" value={String(visible.length)} sub={holdings.length !== visible.length ? `of ${holdings.length}` : 'positions'} />
      </div>

      {/* Holdings / Positions tab toggle */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-800">
        {(['holdings', 'positions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 py-1 text-[11px] font-semibold rounded-full border transition-colors capitalize',
              activeTab === tab
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-slate-700 text-slate-500 hover:text-white hover:border-slate-500'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'positions' ? (
        <div className="border-t border-slate-800 p-4">
          <LivePositions />
        </div>
      ) : (
      <>
      {/* Broker filter chips */}
      {activeBrokers.length > 1 && (
        <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveBroker(null)}
            className={cn(
              'px-3 py-1 text-[11px] font-semibold rounded-full border transition-colors capitalize',
              activeBroker === null
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-slate-700 text-slate-500 hover:text-white hover:border-slate-500'
            )}
          >
            All
          </button>
          {activeBrokers.map(b => (
            <button
              key={b}
              onClick={() => setActiveBroker(b === activeBroker ? null : (b as string))}
              className={cn(
                'px-3 py-1 text-[11px] font-semibold rounded-full border transition-colors capitalize',
                activeBroker === b
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-700 text-slate-500 hover:text-white hover:border-slate-500'
              )}
            >
              {b}
            </button>
          ))}
        </div>
      )}

      {/* Holdings — mobile cards / desktop table */}
      {visible.length > 0 ? (
        <>
          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-slate-800/50 border-t border-slate-800">
            {visible.map(h => {
              const broker = brokerMap[h.brokerAccountId] ?? '—'
              const up = h.gainLoss >= 0
              const dayUp = h.changePercent >= 0
              return (
                <div key={`${h.brokerAccountId}-${h.symbol}`} className="flex items-center px-4 py-3 gap-3 active:bg-slate-800/40 cursor-pointer" onClick={() => router.push(`/trade?symbol=${h.symbol}`)}>
                  {/* Left: symbol + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white text-[14px]">{h.symbol}</p>
                      <span className="text-[9px] font-medium text-slate-600 capitalize bg-slate-800 px-1.5 py-0.5 rounded">{broker}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-500">{h.quantity} qty · avg {fmtINR(h.avgPrice)}</span>
                      <span className={cn('text-[10px] font-semibold', dayUp ? 'text-emerald-500' : 'text-red-400')}>
                        {dayUp ? '▲' : '▼'} {Math.abs(h.changePercent).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {/* Right: value + P&L */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[14px] font-bold text-white tabular-nums">{fmtINR(h.marketValue)}</p>
                    <p className={cn('text-[12px] font-semibold tabular-nums', up ? 'text-emerald-400' : 'text-red-400')}>
                      {fmtChangeINR(h.gainLoss)}
                      <span className="text-[10px] ml-1 opacity-70">
                        {h.gainLossPercent >= 0 ? '+' : ''}{h.gainLossPercent.toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-slate-800">
                  {TABLE_COLS.map((h, i) => (
                    <th
                      key={h}
                      onClick={() => handleSort(h)}
                      className={cn(
                        'px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest cursor-pointer hover:text-slate-400 select-none group',
                        i === 0 && 'sticky left-0 bg-[#0f1117]'
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {h}
                        <span className={cn("text-[10px] transition-opacity", sortField === h ? "opacity-100 text-white" : "opacity-0 group-hover:opacity-50")}>
                          {sortField === h && !sortAsc ? '▼' : '▲'}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedHoldings.map(h => {
                  const broker = brokerMap[h.brokerAccountId] ?? '—'
                  const dayUp  = h.change >= 0
                  return (
                    <tr key={`${h.brokerAccountId}-${h.symbol}`} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => router.push(`/trade?symbol=${h.symbol}`)}>
                      <td className="px-4 py-3 sticky left-0 bg-[#0f1117]">
                        <p className="font-semibold text-white">{h.symbol}</p>
                        <p className="text-[11px] text-slate-600">{h.name !== h.symbol ? h.name : ''}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300 tabular-nums">{h.quantity}</td>
                      <td className="px-4 py-3 text-slate-400 tabular-nums">{fmtINR(h.avgPrice)}</td>
                      <td className="px-4 py-3 text-white font-medium tabular-nums">{fmtINR(h.currentPrice)}</td>
                      <td className={cn('px-4 py-3 tabular-nums text-[12px]', dayUp ? 'text-emerald-400' : 'text-red-400')}>
                        <span>{dayUp ? '+' : ''}{h.changePercent.toFixed(2)}%</span>
                        <span className="text-[11px] opacity-60 ml-1">{fmtChangeINR(h.change * h.quantity)}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 tabular-nums">{fmtINR(h.marketValue)}</td>
                      <td className={cn('px-4 py-3 tabular-nums font-medium', h.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {fmtChangeINR(h.gainLoss)}
                        <span className="text-[11px] ml-1 opacity-70">
                          {h.gainLossPercent >= 0 ? '+' : ''}{h.gainLossPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-medium text-slate-500 capitalize px-1.5 py-0.5 bg-slate-800 rounded">
                          {broker}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="px-5 py-10 text-center border-t border-slate-800">
          <p className="text-slate-600 text-sm">No holdings yet</p>
          <p className="text-slate-700 text-xs mt-1">Connect a broker to see your portfolio</p>
        </div>
      )}

      {/* Broker breakdown footer */}
      {brokerRows.length > 0 && (
        <div className="flex items-center gap-6 px-5 py-3 border-t border-slate-800 overflow-x-auto">
          {brokerRows.map(b => (
            <div key={b.id} className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] text-slate-500 font-medium capitalize">{b.brokerName}</span>
              <span className="text-[11px] text-slate-400 tabular-nums">{fmtINR(b.value)}</span>
              <span className="text-[10px] text-slate-700">·</span>
              <span className="text-[11px] text-slate-600">{b.count} holdings</span>
            </div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  )
}

function Stat({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  const color      = positive === undefined ? 'neutral' : positive ? 'up' : 'down'
  const valueClass = { neutral: 'text-white', up: 'text-emerald-400', down: 'text-red-400' }[color]
  const subClass   = { neutral: 'text-slate-500', up: 'text-emerald-500', down: 'text-red-500' }[color]
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${subClass}`}>{sub}</p>}
    </div>
  )
}
