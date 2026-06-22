import { prisma } from '@/lib/auth'
import { mapPrismaToAppAccount, isGrowwMcp } from '@/lib/broker'
import { brokerAdapter } from '@/lib/services/broker-adapter'
import { getGrowwPositions } from '@/lib/services/groww'
import { getFivePaisaPositions } from '@/lib/services/5paisa'
import type { PositionEntry } from '@/app/api/market/positions/route'

function normalise(p: {
  symbol: string; qty: number; avgPrice: number; ltp: number
  realisedPnl: number; unrealisedPnl: number; product: string; side: 'BUY' | 'SELL'
}, brokerName: string): PositionEntry {
  const realised   = p.realisedPnl   ?? 0
  const unrealised = p.unrealisedPnl ?? 0
  const pnl        = realised + unrealised
  const netQty     = Math.abs(p.qty)
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
      const raw: any[] = data?.data || data?.positions || []
      return raw.map(p => normalise({
        symbol:       p.trading_symbol || p.symbol || '',
        qty:          p.quantity || 0,
        avgPrice:     p.average_price || 0,
        ltp:          p.ltp || 0,
        realisedPnl:  p.realised_pnl || p.realized_pnl || 0,
        unrealisedPnl: p.pnl || p.unrealized_pnl || 0,
        product:      p.product || 'MIS',
        side:         (p.quantity || 0) >= 0 ? 'BUY' : 'SELL',
      }, acc.brokerName))
    })
  )

  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}
