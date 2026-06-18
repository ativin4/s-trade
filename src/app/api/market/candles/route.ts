import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { mapPrismaToAppAccount } from '@/lib/broker'
import { getGrowwAccessToken } from '@/lib/services/groww'
import { brokerAdapter } from '@/lib/services/broker-adapter'

const GROWW_API = 'https://api.groww.in/v1'
const YAHOO_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

const INDEX_MAP: Record<string, string> = {
  NIFTY: '^NSEI', NIFTY50: '^NSEI', BANKNIFTY: '^NSEBANK',
  SENSEX: '^BSESN', FINNIFTY: '^CNXFIN',
}

function toYahooSymbol(sym: string, exchange = 'NSE') {
  if (INDEX_MAP[sym]) return INDEX_MAP[sym]!
  const isUS = exchange === 'US' || exchange === 'NYSE' || exchange === 'NASDAQ'
  return isUS ? sym : `${sym}.NS`
}

function toYahooInterval(mins: number) {
  if (mins <= 1)  return '1m'
  if (mins <= 2)  return '2m'
  if (mins <= 5)  return '5m'
  if (mins <= 15) return '15m'
  if (mins <= 30) return '30m'
  return '60m'
}

function toYahooRange(days: number) {
  if (days <= 1)  return '1d'
  if (days <= 5)  return '5d'
  if (days <= 30) return '1mo'
  return '3mo'
}

async function yahooCandles(symbol: string, intervalMin: number, days: number, exchange = 'NSE') {
  const ySym = toYahooSymbol(symbol, exchange)
  const yInterval = toYahooInterval(intervalMin)
  const yRange = toYahooRange(days)
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}?interval=${yInterval}&range=${yRange}&includePrePost=false`

  const res = await fetch(url, {
    headers: { 'User-Agent': YAHOO_UA, Accept: 'application/json' },
    next: { revalidate: 30 },
  })
  if (!res.ok) throw new Error(`Yahoo ${res.status}`)
  const data = await res.json()
  const chart = data?.chart?.result?.[0]
  if (!chart) throw new Error('no chart data')

  const timestamps: number[] = chart.timestamp ?? []
  const q = chart.indicators?.quote?.[0] ?? {}

  return timestamps
    .map((ts, i) => ({
      time: ts * 1000, // Yahoo returns seconds → convert to ms
      open:   +(q.open?.[i]   ?? 0).toFixed(2),
      high:   +(q.high?.[i]   ?? 0).toFixed(2),
      low:    +(q.low?.[i]    ?? 0).toFixed(2),
      close:  +(q.close?.[i]  ?? 0).toFixed(2),
      volume: Math.round(q.volume?.[i] ?? 0),
    }))
    .filter(c => c.close > 0)
}

function normalizeGrowwCandles(data: any) {
  const raw: number[][] = data?.candles ?? data?.data?.candles ?? []
  return raw.map(([ts, open, high, low, close, volume]) => ({
    time: ts, open, high, low, close, volume,
  }))
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const symbol = searchParams.get('symbol')
  const interval = searchParams.get('interval') ?? '5'
  const exchange = searchParams.get('exchange') ?? 'NSE'
  const days = Math.min(Math.max(1, Number(searchParams.get('days') ?? '1')), 90)
  const isUS = exchange === 'US' || exchange === 'NYSE' || exchange === 'NASDAQ'

  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  // 1. Oracle VM adapter (static IP; handles both NSE and US via yfinance)
  if (brokerAdapter.available()) {
    try {
      const candles = await brokerAdapter.candles(symbol, interval, days, exchange)
      if (candles.length > 0) return NextResponse.json(candles)
    } catch { /* fall through */ }
  }

  // 2. Groww candles (India only, authenticated)
  if (!isUS) {
    const session = await getServerSession(authOptions)
    let token: string | null = null

    if (session?.user?.id) {
      const acc = await prisma.brokerAccount.findFirst({
        where: { userId: session.user.id, brokerName: 'groww', isActive: true },
      })
      if (acc) {
        const account = mapPrismaToAppAccount(acc)
        try { token = account.jwtToken ?? await getGrowwAccessToken(account) }
        catch { /* fall through */ }
      }
    }

    if (token) {
      try {
        const toDate = new Date()
        const fromDate = new Date(toDate)
        fromDate.setDate(fromDate.getDate() - days)
        const params = new URLSearchParams([
          ['trading_symbol', symbol],
          ['exchange', exchange],
          ['interval', interval],
          ['from_date', fromDate.toISOString().split('T')[0]!],
          ['to_date', toDate.toISOString().split('T')[0]!],
        ])
        const res = await fetch(`${GROWW_API}/charts/candles?${params}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'X-API-VERSION': '1.0' },
        })
        if (res.ok) {
          const data = await res.json()
          return NextResponse.json(normalizeGrowwCandles(data))
        }
      } catch { /* fall through */ }
    }
  }

  // 3. Oracle VM market/candles (yfinance, no broker auth)
  if (brokerAdapter.available()) {
    try {
      const candles = await brokerAdapter.marketCandles(symbol, interval, days, exchange)
      if (candles.length > 0) return NextResponse.json(candles)
    } catch { /* fall through */ }
  }

  // 4. Yahoo Finance (local fallback; works well for US tickers)
  try {
    const candles = await yahooCandles(symbol, Number(interval), days, exchange)
    if (candles.length > 0) return NextResponse.json(candles)
  } catch { /* fall through */ }

  return NextResponse.json([])
}
