import { prisma } from '@/lib/auth'
import { mapPrismaToAppAccount, isGrowwMcp } from '@/lib/broker'
import { brokerAdapter } from '@/lib/services/broker-adapter'
import { getGrowwPositions } from '@/lib/services/groww'
import { getFivePaisaPositions } from '@/lib/services/5paisa'
import type { PositionEntry } from '@/app/api/market/positions/route'

function normalise(p: {
  symbol: string; qty: number; avgPrice: number; ltp: number
  realisedPnl: number; unrealisedPnl: number; product: string; side: 'BUY' | 'SELL'
  mtfInterest?: number
}, brokerName: string): PositionEntry {
  const realised   = p.realisedPnl   ?? 0
  const unrealised = p.unrealisedPnl ?? 0
  const pnl        = realised + unrealised
  const netQty     = Math.abs(p.qty)
  const mtfInterest = p.mtfInterest ?? 0
  return {
    symbol:       p.symbol,
    qty:          netQty,
    avgPrice:     p.avgPrice,
    ltp:          p.ltp,
    pnl,
    pnlPercent:   p.avgPrice > 0 && netQty > 0 ? (unrealised / (p.avgPrice * netQty)) * 100 : 0,
    product:      (p.product || 'MIS').toUpperCase() as PositionEntry['product'],
    side:         p.side,
    broker:       brokerName,
    realisedPnl:  realised,
    unrealisedPnl: unrealised,
    ...(mtfInterest ? { mtfInterest } : {}),
  }
}

export async function fetchPositions(userId: string): Promise<PositionEntry[]> {
  const accounts = await prisma.brokerAccount.findMany({
    where: { userId, isActive: true },
  })

  if (brokerAdapter.available()) {
    const synced = accounts.filter(a => mapPrismaToAppAccount(a).isAdapterActive)
    if (synced.length > 0) {
      const results = await Promise.allSettled(
        synced.map(async acc => {
          const positions = await brokerAdapter.positions(acc.brokerName.toLowerCase())
          return positions.map(p => normalise(p, acc.brokerName))
        })
      )
      const merged = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
      if (merged.length > 0) return merged
    }
  }

  // Fallback: Groww direct API
  const results = await Promise.allSettled(
    accounts.map(async (acc): Promise<PositionEntry[]> => {
      const account = mapPrismaToAppAccount(acc)
      if (account.brokerName === '5paisa') return getFivePaisaPositions(account)
      if (account.brokerName !== 'groww' || isGrowwMcp(account)) return []
      const data = await getGrowwPositions(account)
      // Groww v1 API nests under payload[], data[], data.positions[], or positions[]
      const raw: any[] = (
        data?.payload ??
        (Array.isArray(data?.data) ? data.data : null) ??
        data?.data?.positions ??
        data?.positions ??
        []
      )
      // Pick the first finite, non-zero value — Groww returns 0 (not null) for
      // fields it doesn't populate on a given position type, so `??` chaining
      // alone isn't enough; we treat 0 as "missing" for price/pnl fields.
      const firstNum = (...vals: unknown[]): number => {
        for (const v of vals) {
          const n = typeof v === 'string' ? Number(v) : v
          if (typeof n === 'number' && Number.isFinite(n) && n !== 0) return n
        }
        return 0
      }
      return raw.map(p => {
        // API returns camelCase; some older versions used snake_case — handle both.
        // MTF positions use different field names than intraday/delivery.
        const sym     = p.tradingSymbol  || p.trading_symbol  || p.symbol || ''
        const qty     = p.netQuantity    ?? p.quantity         ?? 0
        const avg     = firstNum(
          p.averagePrice, p.average_price,
          p.buyPrice, p.buy_price,
          p.mtfBuyPrice, p.average_price_mtf,
        )
        // LTP: live-price fields first, then fall back to the close price
        const ltp     = firstNum(
          p.lastPrice, p.ltp,
          p.currentPrice, p.current_price,
          p.closePrice, p.close_price,
        )
        const realPnl = firstNum(p.realizedPnl, p.realised_pnl, p.realized_pnl)
        const unreal  = firstNum(
          p.unrealizedPnl, p.unrealisedPnl, p.unrealized_pnl,
          p.mtfPnl, p.mtf_pnl, p.pnl,
        )
        const mtfInt  = firstNum(
          p.mtfInterest, p.mtf_interest,
          p.interest, p.interestAccrued, p.interest_accrued,
        )
        const product = p.product || 'MIS'
        return normalise({
          symbol:        sym,
          qty:           Math.abs(qty),
          avgPrice:      avg,
          ltp,
          realisedPnl:   realPnl,
          unrealisedPnl: unreal,
          product,
          side:          qty >= 0 ? 'BUY' : 'SELL',
          mtfInterest:   mtfInt,
        }, acc.brokerName)
      })
    })
  )

  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}
