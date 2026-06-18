import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolveGrowwToken } from '@/lib/services/market-ltp'

export interface DepthLevel {
  price: number
  qty: number
  orders: number
}

export interface DepthResponse {
  available: boolean
  buyBook: DepthLevel[]
  sellBook: DepthLevel[]
  spread?: number
  symbol?: string
  tsInMillis?: number
}

const GROWW_WEB = 'https://groww.in'

export async function GET(req: NextRequest) {
  const symbol   = req.nextUrl.searchParams.get('symbol')
  const exchange = req.nextUrl.searchParams.get('exchange') ?? 'NSE'

  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  const session    = await getServerSession(authOptions)
  const growwToken = session?.user?.id
    ? await resolveGrowwToken(session.user.id).catch(() => null)
    : null

  if (!growwToken) {
    return NextResponse.json({ available: false, buyBook: [], sellBook: [] } satisfies DepthResponse)
  }

  try {
    const res = await fetch(
      `${GROWW_WEB}/v1/api/stocks_data/v1/tr_live_book/exchange/${exchange}/segment/CASH/${symbol}/latest`,
      {
        headers: {
          Authorization: `Bearer ${growwToken}`,
          Accept: 'application/json',
        },
        next: { revalidate: 0 },
      },
    )
    if (!res.ok) throw new Error(`depth ${res.status}`)
    const data = await res.json()

    const parseBook = (raw: Record<string, { price: number; qty: number; orderCount: number }>): DepthLevel[] =>
      Object.keys(raw)
        .sort((a, b) => Number(a) - Number(b))
        .map(k => ({ price: raw[k]!.price, qty: raw[k]!.qty, orders: raw[k]!.orderCount }))

    const buyBook  = parseBook(data.buyBook  ?? {})
    const sellBook = parseBook(data.sellBook ?? {})
    const spread   = buyBook[0] && sellBook[0]
      ? +(sellBook[0].price - buyBook[0].price).toFixed(2)
      : undefined

    return NextResponse.json({
      available: true,
      buyBook,
      sellBook,
      spread,
      symbol:      data.symbol,
      tsInMillis:  data.tsInMillis,
    } satisfies DepthResponse)
  } catch {
    return NextResponse.json({ available: false, buyBook: [], sellBook: [] } satisfies DepthResponse)
  }
}
