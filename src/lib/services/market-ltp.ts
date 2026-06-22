import { prisma } from '@/lib/auth'
import { mapPrismaToAppAccount } from '@/lib/broker'
import { getGrowwAccessToken } from '@/lib/services/groww'
import { brokerAdapter } from '@/lib/services/broker-adapter'

const GROWW_API     = 'https://api.groww.in/v1'
const GROWW_WEB     = 'https://groww.in'
const YAHOO_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const NSE_HEADERS = {
  'User-Agent': YAHOO_UA,
  Referer: 'https://www.nseindia.com/',
  Accept: 'application/json',
}

const NSE_INDEX_NAME: Record<string, string | null> = {
  NIFTY: 'NIFTY 50', NIFTY50: 'NIFTY 50',
  BANKNIFTY: 'NIFTY BANK',
  FINNIFTY: 'NIFTY FINANCIAL SERVICES',
  SENSEX: null,
}

// Symbols that are BSE indices (separate exchange in Groww batch)
const BSE_INDEX_SET = new Set(['SENSEX'])
// Symbols that are NSE indices (not individual stocks)
const NSE_INDEX_SET = new Set(['NIFTY', 'NIFTY50', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'])

const YAHOO_INDEX_SYM: Record<string, string> = {
  SENSEX: '^BSESN',
}

export interface LtpEntry {
  price: number
  change: number
  changePercent: number
  // enriched (filled when available — Groww batch or Yahoo meta)
  open?: number
  high?: number
  low?: number
  prevClose?: number
  volume?: number
  weekHigh52?: number
  weekLow52?: number
  totalBuyQty?: number
  totalSellQty?: number
}

function toYahooSym(sym: string, exchange = 'NSE'): string {
  if (YAHOO_INDEX_SYM[sym]) return YAHOO_INDEX_SYM[sym]!
  const isUS = exchange === 'US' || exchange === 'NYSE' || exchange === 'NASDAQ'
  return isUS ? sym : `${sym}.NS`
}

async function yahooChartLtp(sym: string, exchange = 'NSE'): Promise<LtpEntry | null> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(toYahooSym(sym, exchange))}?interval=1d&range=1d`
  const res = await fetch(url, { headers: { 'User-Agent': YAHOO_UA }, next: { revalidate: 30 } }).catch(() => null)
  if (!res?.ok) return null
  const data = await res.json().catch(() => null)
  const m = data?.chart?.result?.[0]?.meta
  if (!m) return null
  const prev  = m.chartPreviousClose ?? m.previousClose ?? 0
  const price = +(m.regularMarketPrice ?? 0).toFixed(2)
  const change = +(price - prev).toFixed(2)
  const changePercent = prev > 0 ? +((change / prev) * 100).toFixed(2) : 0
  return {
    price, change, changePercent,
    open:       m.regularMarketOpen      > 0 ? +m.regularMarketOpen.toFixed(2)      : undefined,
    high:       m.regularMarketDayHigh   > 0 ? +m.regularMarketDayHigh.toFixed(2)   : undefined,
    low:        m.regularMarketDayLow    > 0 ? +m.regularMarketDayLow.toFixed(2)    : undefined,
    prevClose:  prev                     > 0 ? +prev.toFixed(2)                     : undefined,
    volume:     m.regularMarketVolume        ? Math.round(m.regularMarketVolume)     : undefined,
    weekHigh52: m.fiftyTwoWeekHigh       > 0 ? +m.fiftyTwoWeekHigh.toFixed(2)       : undefined,
    weekLow52:  m.fiftyTwoWeekLow        > 0 ? +m.fiftyTwoWeekLow.toFixed(2)        : undefined,
  }
}

let _nseCache: { ts: number; data: Record<string, LtpEntry> } | null = null
async function nseIndexLtp(symbols: string[]): Promise<Record<string, LtpEntry>> {
  const now = Date.now()
  if (!_nseCache || now - _nseCache.ts > 15_000) {
    const res = await fetch('https://www.nseindia.com/api/allIndices', {
      headers: NSE_HEADERS, next: { revalidate: 15 },
    }).catch(() => null)
    if (res?.ok) {
      const d = await res.json().catch(() => null)
      const items: any[] = d?.data ?? []
      const map: Record<string, LtpEntry> = {}
      for (const item of items) {
        const prev  = +(item.previousClose ?? item.last ?? 0)
        const price = +(item.last ?? 0).toFixed(2)
        map[item.index] = {
          price,
          change:        +(item.variation ?? 0).toFixed(2),
          changePercent: +(item.percentChange ?? 0).toFixed(2),
          open:      item.open      > 0 ? +item.open.toFixed(2)      : undefined,
          high:      item.high      > 0 ? +item.high.toFixed(2)      : undefined,
          low:       item.low       > 0 ? +item.low.toFixed(2)       : undefined,
          prevClose: prev           > 0 ? +prev.toFixed(2)           : undefined,
        }
      }
      _nseCache = { ts: now, data: map }
    }
  }
  const result: Record<string, LtpEntry> = {}
  if (_nseCache) {
    for (const sym of symbols) {
      const nseName = NSE_INDEX_NAME[sym]
      if (nseName && _nseCache.data[nseName]) result[sym] = _nseCache.data[nseName]
    }
  }
  return result
}

function normGrowwEntry(p: any): LtpEntry {
  const prev  = p.close ?? 0
  const price = p.ltp ?? p.value ?? 0
  return {
    price:        +price.toFixed(2),
    change:       +(p.dayChange  ?? price - prev).toFixed(2),
    changePercent: +(p.dayChangePerc ?? 0).toFixed(2),
    open:         p.open         > 0 ? +p.open.toFixed(2)          : undefined,
    high:         p.high         > 0 ? +p.high.toFixed(2)          : undefined,
    low:          p.low          > 0 ? +p.low.toFixed(2)           : undefined,
    prevClose:    prev           > 0 ? +prev.toFixed(2)            : undefined,
    volume:       p.volume      != null ? Math.round(p.volume)     : undefined,
    weekHigh52:   p.yearHighPrice > 0 ? p.yearHighPrice            : undefined,
    weekLow52:    p.yearLowPrice  > 0 ? p.yearLowPrice             : undefined,
    totalBuyQty:  p.totalBuyQty  ?? undefined,
    totalSellQty: p.totalSellQty ?? undefined,
  }
}

async function growwBatchLtp(
  symbols: string[],
  exchange: string,
  token: string,
): Promise<Record<string, LtpEntry>> {
  const nsePrice = symbols.filter(s => !NSE_INDEX_SET.has(s) && !BSE_INDEX_SET.has(s) && exchange === 'NSE')
  const nseIndex = symbols.filter(s => NSE_INDEX_SET.has(s)).map(s => (s === 'NIFTY50' ? 'NIFTY' : s))
  const bseIndex = symbols.filter(s => BSE_INDEX_SET.has(s))

  const body = {
    exchangeAggReqMap: {
      NSE: { priceSymbolList: nsePrice, indexSymbolList: nseIndex },
      BSE: { priceSymbolList: [],       indexSymbolList: bseIndex },
    },
  }

  const res = await fetch(`${GROWW_WEB}/v1/api/stocks_data/v1/tr_live/segment/CASH/latest_aggregated`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Groww batch ${res.status}`)
  const data = await res.json()

  const result: Record<string, LtpEntry> = {}
  for (const exchKey of ['NSE', 'BSE'] as const) {
    const exchData = data?.exchangeAggRespMap?.[exchKey]
    if (!exchData) continue
    for (const [sym, raw] of Object.entries(exchData.priceLivePointsMap ?? {})) {
      result[sym] = normGrowwEntry(raw as any)
    }
    for (const [growwSym, raw] of Object.entries(exchData.indexLivePointsMap ?? {})) {
      const entry = normGrowwEntry(raw as any)
      // Map back to our symbol keys (e.g. NIFTY50 → NIFTY in Groww)
      const ourKeys = symbols.filter(s => {
        if (s === growwSym) return true
        if (s === 'NIFTY50' && growwSym === 'NIFTY') return true
        return false
      })
      for (const k of ourKeys) result[k] = entry
    }
  }

  return result
}

// In-memory cache: userId → { token, expiresAt }
// Groww tokens typically last 24h; cache for 23h to avoid serving stale tokens.
const _tokenCache = new Map<string, { token: string; expiresAt: number }>()
const TOKEN_TTL_MS = 23 * 60 * 60 * 1000

export async function resolveGrowwToken(userId: string): Promise<string | null> {
  const cached = _tokenCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.token

  const acc = await prisma.brokerAccount.findFirst({
    where: { userId, brokerName: 'groww', isActive: true },
  })
  if (!acc) return null
  const account = mapPrismaToAppAccount(acc)

  try {
    const storedToken = account.jwtToken
    if (storedToken) {
      _tokenCache.set(userId, { token: storedToken, expiresAt: Date.now() + TOKEN_TTL_MS })
      return storedToken
    }
    const freshToken = await getGrowwAccessToken(account)
    _tokenCache.set(userId, { token: freshToken, expiresAt: Date.now() + TOKEN_TTL_MS })
    // Persist so next cold start skips re-auth
    await prisma.brokerAccount.update({
      where: { id: acc.id },
      data: { jwtToken: (await import('@/lib/crypto')).encrypt(freshToken) },
    }).catch(() => {})
    return freshToken
  } catch { return null }
}

export async function fetchLtp(
  symbols: string[],
  exchange = 'NSE',
  growwToken: string | null = null,
): Promise<Record<string, LtpEntry>> {
  if (!symbols.length) return {}

  const isUS     = exchange === 'US' || exchange === 'NYSE' || exchange === 'NASDAQ'
  const adapterOk = brokerAdapter.available()

  if (isUS) {
    if (adapterOk) {
      try {
        const data = await brokerAdapter.marketLtp(symbols, exchange)
        if (Object.values(data).some(v => v.price > 0)) return data
      } catch { /* fall through */ }
    }
    const results = await Promise.allSettled(
      symbols.map(async s => [s, await yahooChartLtp(s, exchange)] as const)
    )
    const merged: Record<string, LtpEntry> = {}
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value[1]) merged[r.value[0]] = r.value[1]
    }
    return Object.keys(merged).length > 0
      ? merged
      : Object.fromEntries(symbols.map(s => [s, { price: 0, change: 0, changePercent: 0 }]))
  }

  // 1. Oracle VM adapter (authenticated broker LTP)
  if (adapterOk) {
    try {
      const data = await brokerAdapter.ltp(symbols)
      if (Object.keys(data).length > 0) return data
    } catch { /* fall through */ }
  }

  // 2. Groww web batch — enriched OHLCV + 52wk (works with web JWT from MCP)
  if (growwToken) {
    try {
      const data = await growwBatchLtp(symbols, exchange, growwToken)
      if (Object.values(data).some(v => v.price > 0)) return data
    } catch { /* fall through */ }
  }

  // 3. Groww trading API per-symbol (TOTP auth token — minimal fields)
  if (growwToken) {
    try {
      const fetches = symbols.map(sym =>
        fetch(`${GROWW_API}/quotes/ltp?trading_symbol=${sym}&exchange=NSE`, {
          headers: { Authorization: `Bearer ${growwToken}`, 'X-API-VERSION': '1.0' },
        }).then(async r => {
          if (!r.ok) return null
          const d = await r.json()
          return [sym, {
            price:         d.ltp ?? d.last_price ?? 0,
            change:        d.change ?? 0,
            changePercent: d.change_percent ?? 0,
          } satisfies LtpEntry] as const
        }).catch(() => null)
      )
      const pairs = (await Promise.all(fetches)).filter(Boolean) as [string, LtpEntry][]
      if (pairs.length === symbols.length) return Object.fromEntries(pairs)
    } catch { /* fall through */ }
  }

  // 4. Oracle VM yfinance (unauthenticated market data)
  if (adapterOk) {
    try {
      const data = await brokerAdapter.marketLtp(symbols, exchange)
      if (Object.values(data).some(v => v.price > 0)) return data
    } catch { /* fall through */ }
  }

  // 5. NSE allIndices + Yahoo v8/chart fallback (enriched)
  const indexSyms         = symbols.filter(s => s in NSE_INDEX_NAME)
  const yahooFallbackSyms = symbols.filter(s => !(s in NSE_INDEX_NAME) || NSE_INDEX_NAME[s] === null)

  const [nseResult, yahooResults] = await Promise.all([
    indexSyms.length ? nseIndexLtp(indexSyms) : Promise.resolve({} as Record<string, LtpEntry>),
    Promise.allSettled(yahooFallbackSyms.map(async s => [s, await yahooChartLtp(s, exchange)] as const)),
  ])

  const merged: Record<string, LtpEntry> = { ...nseResult }
  for (const r of yahooResults) {
    if (r.status === 'fulfilled' && r.value[1]) merged[r.value[0]] = r.value[1]
  }
  for (const sym of indexSyms) {
    if (!merged[sym] && NSE_INDEX_NAME[sym] === null) {
      const y = await yahooChartLtp(sym, exchange).catch(() => null)
      if (y) merged[sym] = y
    }
  }

  return Object.keys(merged).length > 0
    ? merged
    : Object.fromEntries(symbols.map(s => [s, { price: 0, change: 0, changePercent: 0 }]))
}
