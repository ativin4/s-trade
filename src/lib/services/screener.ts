// Univest/Tickertape-style daily stock screener.
// Scans NIFTY 50 symbols against 4 technical screens using free Yahoo Finance
// daily OHLCV. No broker auth required — works in production where
// brokerAdapter.available() is false.

const YAHOO_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

// NIFTY 50 constituents (Yahoo expects a .NS suffix for NSE).
const NIFTY_50 = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'BHARTIARTL', 'ICICIBANK', 'INFOSYS', 'SBIN',
  'HINDUNILVR', 'ITC', 'LT', 'KOTAKBANK', 'AXISBANK', 'BAJFINANCE', 'MARUTI',
  'TITAN', 'ASIANPAINT', 'ULTRACEMCO', 'WIPRO', 'NTPC', 'POWERGRID', 'ONGC',
  'HCLTECH', 'BAJAJFINSV', 'TECHM', 'SUNPHARMA', 'TATASTEEL', 'JSWSTEEL',
  'HINDALCO', 'COALINDIA', 'INDUSINDBK', 'NESTLEIND', 'CIPLA', 'DRREDDY',
  'DIVISLAB', 'BAJAJ-AUTO', 'HEROMOTOCO', 'EICHERMOT', 'TATACONSUM', 'BRITANNIA',
  'APOLLOHOSP', 'ADANIPORTS', 'ADANIENT', 'BPCL', 'IOC', 'GRASIM', 'TATAMOTORS',
  'MM', 'SBILIFE', 'HDFCLIFE', 'UPL',
]

export type ScreenType =
  | 'MOMENTUM_BREAKOUT'
  | 'OVERSOLD_REVERSAL'
  | 'MACD_CROSSOVER'
  | 'VOLUME_SURGE'

export interface ScreenResult {
  symbol: string
  screen: ScreenType
  price: number
  change: number
  changePercent: number
  rsi?: number
  volumeRatio?: number
  sma50?: number
}

interface DailyBars {
  close: number[]
  volume: number[]
  high: number[]
  low: number[]
}

// ── Yahoo fetch ─────────────────────────────────────────────────────────────

// Yahoo's `1mo` range only returns ~22 trading days. We request `3mo` so that
// SMA50 and MACD(26) have enough history to be meaningful.
async function fetchDailyBars(symbol: string): Promise<DailyBars | null> {
  const ySym = `${symbol}.NS`
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ySym
  )}?interval=1d&range=3mo`
  const res = await fetch(url, {
    headers: { 'User-Agent': YAHOO_UA, Accept: 'application/json' },
    next: { revalidate: 1800 },
  }).catch(() => null)
  if (!res?.ok) return null

  const data = await res.json().catch(() => null)
  const chart = data?.chart?.result?.[0]
  if (!chart) return null

  const q = chart.indicators?.quote?.[0] ?? {}
  const closeRaw: (number | null)[] = q.close ?? []
  const volumeRaw: (number | null)[] = q.volume ?? []
  const highRaw: (number | null)[] = q.high ?? []
  const lowRaw: (number | null)[] = q.low ?? []

  const close: number[] = []
  const volume: number[] = []
  const high: number[] = []
  const low: number[] = []

  // Drop bars with null close (holidays / partial sessions).
  for (let i = 0; i < closeRaw.length; i++) {
    const c = closeRaw[i]
    if (c == null || c <= 0) continue
    close.push(c)
    volume.push(volumeRaw[i] ?? 0)
    high.push(highRaw[i] ?? c)
    low.push(lowRaw[i] ?? c)
  }

  if (close.length < 20) return null
  return { close, volume, high, low }
}

// ── Indicators ──────────────────────────────────────────────────────────────

function sma(values: number[], period: number): number | undefined {
  if (values.length < period) return undefined
  const slice = values.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

function ema(values: number[], period: number): number[] {
  if (values.length < period) return []
  const k = 2 / (period + 1)
  const out: number[] = []
  // Seed with the SMA of the first `period` values.
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  out.push(prev)
  for (let i = period; i < values.length; i++) {
    prev = values[i]! * k + prev * (1 - k)
    out.push(prev)
  }
  return out
}

// Wilder's RSI over `period` bars.
function rsi(closes: number[], period = 14): number | undefined {
  if (closes.length < period + 1) return undefined
  let gain = 0
  let loss = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i]! - closes[i - 1]!
    if (diff >= 0) gain += diff
    else loss -= diff
  }
  let avgGain = gain / period
  let avgLoss = loss / period
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i]! - closes[i - 1]!
    const g = diff >= 0 ? diff : 0
    const l = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + g) / period
    avgLoss = (avgLoss * (period - 1) + l) / period
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

interface MacdLine {
  macd: number[]
  signal: number[]
}

// MACD(12, 26, 9). Returns the aligned tail of the macd + signal series.
function macd(closes: number[], fast = 12, slow = 26, signalP = 9): MacdLine | undefined {
  if (closes.length < slow + signalP) return undefined
  const emaFast = ema(closes, fast)
  const emaSlow = ema(closes, slow)
  if (!emaFast.length || !emaSlow.length) return undefined

  // emaFast is longer than emaSlow; align both to the slow EMA's timeline.
  const offset = emaFast.length - emaSlow.length
  const macdLine: number[] = []
  for (let i = 0; i < emaSlow.length; i++) {
    macdLine.push(emaFast[i + offset]! - emaSlow[i]!)
  }
  const signalLine = ema(macdLine, signalP)
  if (!signalLine.length) return undefined

  // Trim macd to match the signal timeline.
  const trimmed = macdLine.slice(macdLine.length - signalLine.length)
  return { macd: trimmed, signal: signalLine }
}

// ── Screens ─────────────────────────────────────────────────────────────────

function evaluate(symbol: string, bars: DailyBars): ScreenResult[] {
  const { close, volume, low } = bars
  const n = close.length
  const price = +close[n - 1]!.toFixed(2)
  const prevClose = close[n - 2] ?? price
  const change = +(price - prevClose).toFixed(2)
  const changePercent = prevClose > 0 ? +((change / prevClose) * 100).toFixed(2) : 0

  const sma50 = sma(close, 50)
  const sma200 = sma(close, 200)
  const rsi14 = rsi(close, 14)

  // Volume ratio: today vs trailing 20-day average (excluding today).
  let volumeRatio: number | undefined
  if (volume.length >= 21) {
    const last20 = volume.slice(n - 21, n - 1)
    const avg20 = last20.reduce((a, b) => a + b, 0) / last20.length
    if (avg20 > 0) volumeRatio = +(volume[n - 1]! / avg20).toFixed(2)
  }

  const macdLine = macd(close)

  const results: ScreenResult[] = []
  const base = {
    symbol,
    price,
    change,
    changePercent,
    rsi: rsi14 != null ? +rsi14.toFixed(1) : undefined,
    volumeRatio,
    sma50: sma50 != null ? +sma50.toFixed(2) : undefined,
  }

  // MOMENTUM_BREAKOUT: price > SMA50, volume > 1.5x avg, RSI 55-70.
  if (
    sma50 != null && price > sma50 &&
    volumeRatio != null && volumeRatio > 1.5 &&
    rsi14 != null && rsi14 >= 55 && rsi14 <= 70
  ) {
    results.push({ ...base, screen: 'MOMENTUM_BREAKOUT' })
  }

  // OVERSOLD_REVERSAL: RSI < 38, price > SMA200 (if available), near 52wk low.
  // "Near 52wk low" approximated as within 8% of the 3mo low (best available).
  const periodLow = Math.min(...low)
  const nearLow = periodLow > 0 && price <= periodLow * 1.08
  if (
    rsi14 != null && rsi14 < 38 &&
    (sma200 == null || price > sma200) &&
    nearLow
  ) {
    results.push({ ...base, screen: 'OVERSOLD_REVERSAL' })
  }

  // MACD_CROSSOVER: MACD crossed above signal line within the last 3 days.
  if (macdLine && macdLine.macd.length >= 4) {
    const m = macdLine.macd
    const s = macdLine.signal
    const len = m.length
    let crossed = false
    for (let k = 1; k <= 3; k++) {
      const i = len - k
      if (i < 1) break
      const prevDiff = m[i - 1]! - s[i - 1]!
      const curDiff = m[i]! - s[i]!
      if (prevDiff <= 0 && curDiff > 0) {
        crossed = true
        break
      }
    }
    if (crossed) results.push({ ...base, screen: 'MACD_CROSSOVER' })
  }

  // VOLUME_SURGE: volume > 2.5x 20d avg, price up > 1.5% on the day.
  if (volumeRatio != null && volumeRatio > 2.5 && changePercent > 1.5) {
    results.push({ ...base, screen: 'VOLUME_SURGE' })
  }

  return results
}

// ── Orchestration ───────────────────────────────────────────────────────────

// Run fetches in batches to cap concurrent Yahoo requests.
async function batchedFetch(
  symbols: string[],
  size: number
): Promise<Array<readonly [string, DailyBars | null]>> {
  const out: Array<readonly [string, DailyBars | null]> = []
  for (let i = 0; i < symbols.length; i += size) {
    const batch = symbols.slice(i, i + size)
    const settled = await Promise.allSettled(
      batch.map(async (sym) => [sym, await fetchDailyBars(sym)] as const)
    )
    for (const r of settled) {
      if (r.status === 'fulfilled') out.push(r.value)
    }
  }
  return out
}

export async function runScreeners(): Promise<ScreenResult[]> {
  const fetched = await batchedFetch(NIFTY_50, 10)
  const results: ScreenResult[] = []
  for (const [symbol, bars] of fetched) {
    if (!bars) continue
    try {
      results.push(...evaluate(symbol, bars))
    } catch {
      /* skip a symbol that fails indicator math */
    }
  }
  return results
}

export { NIFTY_50 }
