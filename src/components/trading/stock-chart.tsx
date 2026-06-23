'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

// ── types ─────────────────────────────────────────────────────────────────────

export interface Candle {
  time: number   // unix ms
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface OrderMarker {
  price: number
  type: 'BUY' | 'SELL'
  symbol: string
  qty: number
  time: number   // unix ms
}

interface StockChartProps {
  symbol: string
  interval?: number
  orderMarkers?: OrderMarker[]
}

// ── constants ─────────────────────────────────────────────────────────────────

const INTERVALS = [
  { label: '1m',  value: 1    },
  { label: '5m',  value: 5    },
  { label: '15m', value: 15   },
  { label: '1h',  value: 60   },
  { label: '1D',  value: 1440 },
] as const

const INDICATORS = ['VWAP', 'SMA20', 'SMA50', 'EMA20', 'BB', 'RSI'] as const
type Indicator = typeof INDICATORS[number]

const INDICATOR_CLASSES: Record<Indicator, string> = {
  VWAP:  'border-yellow-500 text-yellow-400',
  SMA20: 'border-violet-500 text-violet-400',
  SMA50: 'border-orange-500 text-orange-400',
  EMA20: 'border-emerald-500 text-emerald-400',
  BB:    'border-gray-400 text-gray-300',
  RSI:   'border-purple-400 text-purple-300',
}

const CHART_THEME = {
  bg:    '#0f1117',
  grid:  'rgba(255,255,255,0.04)',
  text:  '#6b7280',
  border:'#1e293b',
  up:    '#10b981',
  down:  '#ef4444',
}

const IND_COLOR: Record<Indicator, string> = {
  VWAP:  '#f59e0b',
  SMA20: '#a78bfa',
  SMA50: '#f97316',
  EMA20: '#34d399',
  BB:    '#6b7280',
  RSI:   '#c084fc',
}

// ── indicator math ────────────────────────────────────────────────────────────

function calcVWAP(candles: Candle[]): (number | null)[] {
  let cumTPV = 0, cumVol = 0
  return candles.map(c => {
    const tp = (c.high + c.low + c.close) / 3
    cumTPV += tp * c.volume; cumVol += c.volume
    return cumVol > 0 ? cumTPV / cumVol : c.close
  })
}

function calcSMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = []
  let sum = 0
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i]!
    if (i >= period) sum -= closes[i - period]!
    result.push(i < period - 1 ? null : sum / period)
  }
  return result
}

function calcEMA(closes: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1)
  const result: (number | null)[] = Array(period - 1).fill(null)
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period
  result.push(ema)
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] ?? 0) * k + ema * (1 - k); result.push(ema)
  }
  return result
}

function calcBB(closes: number[], period = 20, mul = 2) {
  const sma = calcSMA(closes, period)
  return closes.map((_, i) => {
    const mean = sma[i]
    if (i < period - 1 || mean == null) return { upper: null, mid: null, lower: null }
    const std = Math.sqrt(closes.slice(i - period + 1, i + 1).reduce((s, v) => s + (v - mean) ** 2, 0) / period)
    return { upper: mean + mul * std, mid: mean, lower: mean - mul * std }
  })
}

function calcRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = Array(period).fill(null)
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const d = (closes[i] ?? 0) - (closes[i - 1] ?? 0)
    d > 0 ? (gains += d) : (losses -= d)
  }
  let avgGain = gains / period, avgLoss = losses / period
  result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  for (let i = period + 1; i < closes.length; i++) {
    const d = (closes[i] ?? 0) - (closes[i - 1] ?? 0)
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  }
  return result
}

function fmtVol(v: number): string {
  if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`
  if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`
  return `${(v / 1000).toFixed(0)}K`
}

function toTs(ms: number) { return Math.floor(ms / 1000) }

// ── component ─────────────────────────────────────────────────────────────────

export function StockChart({ symbol, interval: defaultInterval = 5, orderMarkers = [] }: StockChartProps) {
  const priceRef   = useRef<HTMLDivElement>(null)
  const rsiRef     = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartsRef  = useRef<{ price: any; rsi: any }>({ price: null, rsi: null })

  const [candles, setCandles]   = useState<Candle[]>([])
  const [interval, setInterval] = useState(defaultInterval)
  const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(
    new Set(['VWAP', 'SMA20', 'EMA20'])
  )
  const [loading, setLoading]   = useState(false)
  const [prevClose, setPrevClose] = useState<number | null>(null)

  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const handleAiAnalyze = async () => {
    if (!candles.length || !symbol) return
    setAiLoading(true)
    setAiInsight(null)
    try {
      const res = await fetch('/api/ai/analyze-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, candles, interval }),
      })
      const data = await res.json()
      if (data.insight) setAiInsight(data.insight)
      else setAiInsight(data.error || 'Failed to generate analysis.')
    } catch {
      setAiInsight('Error generating analysis.')
    } finally {
      setAiLoading(false)
    }
  }

  const fetchCandles = useCallback(async (sym: string, iv: number) => {
    if (!sym) return
    setLoading(true)
    try {
      const days = iv <= 15 ? 1 : iv <= 60 ? 5 : 30
      const [candleRes, ltpRes] = await Promise.all([
        fetch(`/api/market/candles?symbol=${sym}&interval=${iv}&days=${days}`),
        fetch(`/api/market/ltp?symbols=${sym}`),
      ])
      const [candleData, ltpData] = await Promise.all([candleRes.json(), ltpRes.json()])
      setCandles(Array.isArray(candleData) ? candleData : [])
      const entry = ltpData?.[sym]
      if (entry && entry.price > 0) {
        setPrevClose(entry.prevClose ?? +(entry.price - entry.change).toFixed(2))
      } else {
        setPrevClose(null)
      }
    } catch { setCandles([]); setPrevClose(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCandles(symbol, interval) }, [symbol, interval, fetchCandles])

  // ── chart build ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!candles.length || !priceRef.current) return

    const on     = (id: Indicator) => activeIndicators.has(id)
    const closes = candles.map(c => c.close)
    let destroyed = false

    ;(async () => {
      const lc = await import('lightweight-charts')
      const {
        createChart, createSeriesMarkers,
        CandlestickSeries, HistogramSeries, LineSeries,
        ColorType, CrosshairMode, LineStyle,
      } = lc

      if (destroyed || !priceRef.current) return

      chartsRef.current.price?.remove()
      chartsRef.current.rsi?.remove()

      const sharedLayout = {
        layout: {
          background: { type: ColorType.Solid, color: CHART_THEME.bg },
          textColor: CHART_THEME.text,
          fontSize: 11,
        },
        grid: {
          vertLines: { color: CHART_THEME.grid },
          horzLines: { color: CHART_THEME.grid },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: CHART_THEME.border },
        timeScale: { borderColor: CHART_THEME.border, timeVisible: true, secondsVisible: false },
        handleScroll: true,
        handleScale: true,
      }

      // ── Price pane ──────────────────────────────────────────────────────────

      const priceChart = createChart(priceRef.current!, {
        ...sharedLayout,
        width: priceRef.current!.clientWidth,
        height: 340,
      })
      chartsRef.current.price = priceChart

      const candleSeries = priceChart.addSeries(CandlestickSeries, {
        upColor:         CHART_THEME.up,
        downColor:       CHART_THEME.down,
        borderUpColor:   CHART_THEME.up,
        borderDownColor: CHART_THEME.down,
        wickUpColor:     CHART_THEME.up,
        wickDownColor:   CHART_THEME.down,
      })
      candleSeries.setData(
        candles.map(c => ({ time: toTs(c.time) as any, open: c.open, high: c.high, low: c.low, close: c.close }))
      )

      // Volume overlay (bottom 18% of pane)
      const volSeries = priceChart.addSeries(HistogramSeries, {
        color: '#3b82f620',
        priceFormat: { type: 'volume' as const },
        priceScaleId: 'vol',
      })
      volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })
      volSeries.setData(
        candles.map(c => ({
          time:  toTs(c.time) as any,
          value: c.volume,
          color: c.close >= c.open ? '#10b98128' : '#ef444428',
        }))
      )

      // Helper: filtered line data
      const lineData = (vals: (number | null)[]) =>
        vals.map((v, i) => v != null ? ({ time: toTs(candles[i]!.time) as any, value: v }) : null).filter(Boolean) as any[]

      if (on('VWAP'))  priceChart.addSeries(LineSeries, { color: IND_COLOR.VWAP,  lineWidth: 1, lineStyle: LineStyle.Dashed,  priceLineVisible: false, lastValueVisible: false }).setData(lineData(calcVWAP(candles)))
      if (on('SMA20')) priceChart.addSeries(LineSeries, { color: IND_COLOR.SMA20, lineWidth: 1,                               priceLineVisible: false, lastValueVisible: false }).setData(lineData(calcSMA(closes, 20)))
      if (on('SMA50')) priceChart.addSeries(LineSeries, { color: IND_COLOR.SMA50, lineWidth: 1,                               priceLineVisible: false, lastValueVisible: false }).setData(lineData(calcSMA(closes, 50)))
      if (on('EMA20')) priceChart.addSeries(LineSeries, { color: IND_COLOR.EMA20, lineWidth: 1, lineStyle: LineStyle.Dotted,  priceLineVisible: false, lastValueVisible: false }).setData(lineData(calcEMA(closes, 20)))
      if (on('BB')) {
        const bb = calcBB(closes)
        for (const key of ['upper', 'lower'] as const) priceChart.addSeries(LineSeries, { color: IND_COLOR.BB, lineWidth: 1, priceLineVisible: false, lastValueVisible: false }).setData(lineData(bb.map(b => b[key])))
        priceChart.addSeries(LineSeries, { color: IND_COLOR.BB, lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false }).setData(lineData(bb.map(b => b.mid)))
      }

      // Order markers
      const symbolMarkers = orderMarkers.filter(o => o.symbol === symbol)
      if (symbolMarkers.length) {
        createSeriesMarkers(
          candleSeries,
          [...symbolMarkers]
            .sort((a, b) => a.time - b.time)
            .map(o => ({
              time:      toTs(o.time) as any,
              position:  o.type === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
              color:     o.type === 'BUY' ? CHART_THEME.up : CHART_THEME.down,
              shape:     o.type === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const,
              text:      `${o.type} ${o.qty}`,
            }))
        )
      }

      priceChart.timeScale().fitContent()

      // ── RSI pane ────────────────────────────────────────────────────────────

      if (on('RSI') && rsiRef.current && !destroyed) {
        const rsiChart = createChart(rsiRef.current!, {
          ...sharedLayout,
          width: rsiRef.current!.clientWidth,
          height: 100,
          timeScale: { ...sharedLayout.timeScale, visible: false },
        })
        chartsRef.current.rsi = rsiChart

        const rsiLine = rsiChart.addSeries(LineSeries, { color: IND_COLOR.RSI, lineWidth: 2, priceLineVisible: false, lastValueVisible: true })
        rsiLine.setData(lineData(calcRSI(closes)))

        const flatData = candles.map(c => ({ time: toTs(c.time) as any }))
        rsiChart.addSeries(LineSeries, { color: 'rgba(239,68,68,0.35)',  lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false }).setData(flatData.map(d => ({ ...d, value: 70 })))
        rsiChart.addSeries(LineSeries, { color: 'rgba(16,185,129,0.35)', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false }).setData(flatData.map(d => ({ ...d, value: 30 })))

        // Sync crosshair
        priceChart.subscribeCrosshairMove(p => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (p.time != null) rsiChart.setCrosshairPosition(p.time as any, 50 as any, rsiLine as any)
        })

        rsiChart.timeScale().fitContent()
      }

      // Responsive
      const ro = new ResizeObserver(() => {
        if (priceRef.current) priceChart.applyOptions({ width: priceRef.current.clientWidth })
        if (rsiRef.current && chartsRef.current.rsi) chartsRef.current.rsi.applyOptions({ width: rsiRef.current.clientWidth })
      })
      if (priceRef.current) ro.observe(priceRef.current)
      return () => ro.disconnect()
    })()

    return () => {
      destroyed = true
      chartsRef.current.price?.remove()
      chartsRef.current.rsi?.remove()
      chartsRef.current = { price: null, rsi: null }
    }
  }, [candles, activeIndicators, orderMarkers, symbol])

  const toggleIndicator = (id: Indicator) => {
    setActiveIndicators(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col bg-[#0f1117] border border-slate-800 rounded-lg overflow-hidden">
      <OhlcBar symbol={symbol} candles={candles} loading={loading} prevClose={prevClose} />

      {aiInsight && (
        <div className="px-3 py-2 bg-indigo-950/30 border-b border-slate-800 flex items-start gap-2">
          <AutoAwesomeIcon className="text-indigo-400 mt-0.5" sx={{ fontSize: 16 }} />
          <p className="text-xs text-indigo-200 leading-relaxed">{aiInsight}</p>
        </div>
      )}

      <div className="px-3 pt-2 pb-2 border-b border-slate-800 flex justify-between items-start gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex gap-1">
            {INTERVALS.map(iv => (
              <button
                key={iv.value}
                onClick={() => setInterval(iv.value)}
                className={cn(
                  'px-2 py-0.5 text-xs rounded transition-colors',
                  interval === iv.value
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-white hover:bg-slate-700'
                )}
              >
                {iv.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {INDICATORS.map(id => (
              <button
                key={id}
                onClick={() => toggleIndicator(id)}
                className={cn(
                  'px-2 py-0.5 text-[11px] rounded border transition-colors',
                  activeIndicators.has(id)
                    ? INDICATOR_CLASSES[id]
                    : 'border-slate-700 text-slate-600 hover:border-slate-500'
                )}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAiAnalyze}
          disabled={aiLoading || !candles.length}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 hover:text-indigo-300 border border-indigo-500/30 transition-colors disabled:opacity-50 text-xs font-semibold whitespace-nowrap mt-1"
        >
          {aiLoading ? <span className="animate-spin text-lg leading-none">↻</span> : <AutoAwesomeIcon sx={{ fontSize: 14 }} />}
          {aiLoading ? 'Analyzing...' : 'AI Analyze'}
        </button>
      </div>

      <div className="p-2 flex-1 min-w-0">
        <div ref={priceRef} className="w-full" />
        {activeIndicators.has('RSI') && (
          <div className="mt-1">
            <div className="text-[10px] text-slate-600 pl-1 mb-0.5">RSI (14)</div>
            <div ref={rsiRef} className="w-full" />
          </div>
        )}
      </div>
    </div>
  )
}

// ── OHLC bar ──────────────────────────────────────────────────────────────────

function OhlcBar({ symbol, candles, loading, prevClose }: {
  symbol: string; candles: Candle[]; loading: boolean; prevClose: number | null
}) {
  if (!candles.length) return (
    <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-3">
      <span className="text-base font-bold text-white">{symbol || '—'}</span>
      {loading && <span className="text-xs text-slate-500 animate-pulse">loading…</span>}
    </div>
  )

  const last   = candles[candles.length - 1]!
  const first  = candles[0]!
  const ltp    = last.close
  const base   = prevClose ?? first.open   // prefer prev close for accurate day change
  const chg    = ltp - base
  const chgPct = base > 0 ? (chg / base) * 100 : 0
  let high = -Infinity, low = Infinity
  for (const c of candles) { if (c.high > high) high = c.high; if (c.low < low) low = c.low }
  const vol    = candles.reduce((s, c) => s + c.volume, 0)
  const up     = chg >= 0
  const pc     = up ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-3 flex-wrap">
      <span className="text-[15px] font-extrabold text-white tracking-tight">{symbol}</span>
      <span className={cn('text-[18px] font-bold tabular-nums', pc)}>
        ₹{ltp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </span>
      <span className={cn('text-[13px] font-semibold', pc)}>
        {up ? '▲' : '▼'} {Math.abs(chgPct).toFixed(2)}% ({up ? '+' : ''}{chg.toFixed(1)})
      </span>
      {loading && <span className="text-[11px] text-slate-500 animate-pulse">updating…</span>}
      <div className="ml-auto flex items-center gap-3 text-[11px]">
        <Stat label="O" value={first.open.toFixed(0)} />
        <Stat label="H" value={high.toFixed(0)}  className="text-emerald-400/70" />
        <Stat label="L" value={low.toFixed(0)}   className="text-red-400/70" />
        <Stat label="V" value={fmtVol(vol)} />
      </div>
    </div>
  )
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <span className="text-slate-500">
      {label} <span className={cn('tabular-nums', className ?? 'text-slate-300')}>{value}</span>
    </span>
  )
}
