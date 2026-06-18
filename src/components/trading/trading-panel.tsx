'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { fmtINR } from '@/lib/format'
import { MarketDepth } from '@/components/trading/market-depth'
import type { BrokerAccount, UserSettings } from '@/app/types'

interface TradingPanelProps {
  brokerAccounts: BrokerAccount[]
  userSettings: UserSettings | null
  symbol: string
  defaultSide?: 'BUY' | 'SELL'
  ltp?: number
}

type FormValues = {
  brokerAccountId: string
  trading_symbol: string
  quantity: number
  price?: number
  trigger_price?: number
  order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M'
  product: 'MIS' | 'CNC' | 'NRML'
  exchange: 'NSE' | 'BSE'
  segment: 'CASH' | 'FNO'
  validity: 'DAY' | 'IOC'
}

type OrderStatus = { orderId?: string; error?: string } | null
type PanelTab = 'order' | 'depth'

type Pill<T extends string> = { label: string; value: T }

const PRODUCTS: Pill<'MIS' | 'CNC' | 'NRML'>[] = [
  { label: 'MIS',  value: 'MIS'  },
  { label: 'CNC',  value: 'CNC'  },
  { label: 'NRML', value: 'NRML' },
]

const ORDER_TYPES: Pill<'MARKET' | 'LIMIT' | 'SL' | 'SL-M'>[] = [
  { label: 'MKT',  value: 'MARKET' },
  { label: 'LMT',  value: 'LIMIT'  },
  { label: 'SL',   value: 'SL'     },
  { label: 'SL-M', value: 'SL-M'  },
]

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Pill<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 py-1 text-[11px] font-semibold rounded border transition-colors',
            value === o.value
              ? 'bg-slate-600 border-slate-500 text-white'
              : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function TradingPanel({ brokerAccounts, userSettings, symbol, defaultSide = 'BUY', ltp }: TradingPanelProps) {
  const [side, setSide]         = useState<'BUY' | 'SELL'>(defaultSide)
  const [panelTab, setPanelTab] = useState<PanelTab>('order')
  const [status, setStatus]     = useState<OrderStatus>(null)
  const [loading, setLoading]   = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      trading_symbol: symbol,
      order_type: 'MARKET',
      product: 'MIS',
      exchange: 'NSE',
      segment: 'CASH',
      validity: 'DAY',
      brokerAccountId: brokerAccounts[0]?.id ?? '',
    },
  })

  useEffect(() => {
    setValue('trading_symbol', symbol)
    setStatus(null)
  }, [symbol, setValue])

  useEffect(() => {
    setSide(defaultSide)
  }, [defaultSide])

  const orderType = watch('order_type')
  const product = watch('product')
  const qty = watch('quantity')

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, transaction_type: side }),
      })
      const json = await res.json()
      if (!res.ok) setStatus({ error: json.error })
      else setStatus({ orderId: json.orderId })
    } catch (e) {
      setStatus({ error: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const isBuy = side === 'BUY'

  return (
    <div className="flex flex-col bg-[#0f1117] border border-slate-800 rounded-lg overflow-hidden">
      {/* BUY / SELL + ORDER / DEPTH toggles */}
      <div className="grid grid-cols-2 border-b border-slate-800/60">
        <button
          onClick={() => setSide('BUY')}
          className={cn(
            'py-2.5 text-sm font-bold tracking-widest transition-colors',
            isBuy ? 'bg-emerald-700 text-white' : 'bg-[#0d0f14] text-slate-600 hover:text-slate-400'
          )}
        >
          BUY
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={cn(
            'py-2.5 text-sm font-bold tracking-widest transition-colors',
            !isBuy ? 'bg-red-700 text-white' : 'bg-[#0d0f14] text-slate-600 hover:text-slate-400'
          )}
        >
          SELL
        </button>
      </div>
      <div className="flex border-b border-slate-800 bg-[#0d0f14]">
        {(['order', 'depth'] as PanelTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setPanelTab(tab)}
            className={cn(
              'flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2',
              panelTab === tab
                ? isBuy ? 'text-emerald-400 border-emerald-500' : 'text-red-400 border-red-500'
                : 'text-slate-600 border-transparent hover:text-slate-400'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {panelTab === 'depth' && (
        <MarketDepth symbol={symbol} />
      )}

      {panelTab === 'order' && (
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 p-3">
        {/* Symbol */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Symbol</label>
          <input
            {...register('trading_symbol', { required: true })}
            className="w-full mt-1 bg-slate-800 border border-slate-700 focus:border-blue-600 rounded px-2 py-1.5 text-sm font-semibold text-white uppercase focus:outline-none"
          />
        </div>

        {/* Product */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Product</label>
          <div className="mt-1">
            <PillGroup options={PRODUCTS} value={product} onChange={v => setValue('product', v)} />
          </div>
        </div>

        {/* Order Type */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Order Type</label>
          <div className="mt-1">
            <PillGroup options={ORDER_TYPES} value={orderType} onChange={v => setValue('order_type', v)} />
          </div>
        </div>

        {/* Qty */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Quantity</label>
          <input
            {...register('quantity', { required: 'Required', min: 1, valueAsNumber: true })}
            type="number"
            min={1}
            placeholder="0"
            className="w-full mt-1 bg-slate-800 border border-slate-700 focus:border-blue-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
          />
          {errors.quantity && <p className="text-[10px] text-red-500 mt-0.5">{errors.quantity.message}</p>}
        </div>

        {/* Price */}
        {(orderType === 'LIMIT' || orderType === 'SL') && (
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Price (₹)</label>
            <input
              {...register('price', { valueAsNumber: true })}
              type="number"
              step="0.05"
              placeholder="0.00"
              className="w-full mt-1 bg-slate-800 border border-slate-700 focus:border-blue-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
            />
          </div>
        )}

        {/* Est. value */}
        {(() => {
          const q = qty || 0
          const p = orderType === 'MARKET' ? ltp : watch('price')
          if (q > 0 && p && p > 0) {
            const est = q * p
            return (
              <div className="flex justify-between items-center py-1 px-2 bg-slate-800/60 rounded text-[11px]">
                <span className="text-slate-500">{q} × {fmtINR(p)}</span>
                <span className={`font-bold ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtINR(est)}
                </span>
              </div>
            )
          }
          return null
        })()}

        {/* Trigger Price */}
        {(orderType === 'SL' || orderType === 'SL-M') && (
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Trigger (₹)</label>
            <input
              {...register('trigger_price', { valueAsNumber: true })}
              type="number"
              step="0.05"
              placeholder="0.00"
              className="w-full mt-1 bg-slate-800 border border-slate-700 focus:border-blue-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
            />
          </div>
        )}

        {/* Broker select (only if multiple) */}
        {brokerAccounts.length > 1 && (
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Broker</label>
            <select
              {...register('brokerAccountId')}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
            >
              {brokerAccounts.map(a => (
                <option key={a.id} value={a.id}>{a.brokerName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-800" />

        {/* Budget hint */}
        {userSettings?.maxBudgetPerTrade && (
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500">Budget/trade</span>
            <span className="text-slate-300">{fmtINR(Number(userSettings.maxBudgetPerTrade))}</span>
          </div>
        )}

        {/* Status */}
        {status?.orderId && (
          <div className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 rounded px-2 py-1.5">
            ✓ Placed — {status.orderId}
          </div>
        )}
        {status?.error && (
          <div className="text-[11px] text-red-400 bg-red-950/60 border border-red-800 rounded px-2 py-1.5">
            {status.error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || brokerAccounts.length === 0}
          className={cn(
            'w-full py-2.5 rounded text-sm font-bold text-white tracking-wide transition-colors disabled:opacity-40',
            isBuy
              ? 'bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800'
              : 'bg-red-700 hover:bg-red-600 active:bg-red-800'
          )}
        >
          {loading ? 'Placing…' : `${side} ${symbol}`}
        </button>

        {brokerAccounts.length === 0 && (
          <p className="text-[11px] text-center text-slate-600">Connect a broker to trade</p>
        )}
      </form>
      )}
    </div>
  )
}
