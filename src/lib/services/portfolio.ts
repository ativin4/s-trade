
import { cache } from 'react'
import type { BrokerAccount, PortfolioHolding } from '@/app/types'
import { getGrowwHoldings } from '@/lib/services/groww'
import { getFivePaisaHoldings } from '@/lib/services/5paisa'
import { getMcpPortfolio } from '@/lib/mcp'
import { brokerAdapter } from '@/lib/services/broker-adapter'
import { isGrowwMcp } from '@/lib/broker'
import type { AIRecommendation } from '@/app/types'

function toPortfolioHolding(h: import('@/lib/services/broker-adapter').AdapterHolding, brokerAccountId: string): PortfolioHolding {
  const invested = h.avgPrice * h.qty
  return {
    symbol:           h.symbol,
    name:             h.symbol,
    quantity:         h.qty,
    avgPrice:         h.avgPrice,
    currentPrice:     h.ltp,
    marketValue:      h.ltp * h.qty,
    gainLoss:         h.pnl,
    gainLossPercent:  invested > 0 ? (h.pnl / invested) * 100 : 0,
    change:           h.dayChange,
    changePercent:    h.dayChangePct,
    aiRecommendation: 'HOLD' as const,
    confidence:       0,
    insight:          '',
    brokerAccountId,
  }
}

function settled<T>(results: PromiseSettledResult<T[]>[]): T[] {
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}

// Brokers with direct API support independent of the adapter
const DIRECT_API_BROKERS = new Set(['zerodha'])

async function directHoldings(account: BrokerAccount): Promise<PortfolioHolding[]> {
  switch (account.brokerName) {
    case 'groww':
      if (isGrowwMcp(account)) return getMcpPortfolio(account)
      return getGrowwHoldings(account)
    case 'zerodha':
      return getMcpPortfolio(account)
    case '5paisa':
      return getFivePaisaHoldings(account)
    default:
      return []
  }
}

export async function getBrokerPortfolios(
  accounts: BrokerAccount[]
): Promise<PortfolioHolding[]> {
  const adapterAvailable = brokerAdapter.available()

  // Adapter path: only synced accounts when adapter is actually configured
  const adapterAccounts = adapterAvailable
    ? accounts.filter(a => a.isAdapterActive && !DIRECT_API_BROKERS.has(a.brokerName))
    : []
  // Direct API: everything else (including synced accounts for adapter-less brokers)
  const directAccounts = accounts.filter(
    a => !adapterAvailable || !a.isAdapterActive || DIRECT_API_BROKERS.has(a.brokerName)
  )

  const [adapterResults, directResults] = await Promise.all([
    adapterAccounts.length
      ? Promise.allSettled(
          adapterAccounts.map(async (acc) => {
            const items = await brokerAdapter.holdings(acc.brokerName.toLowerCase())
            return items.map(h => toPortfolioHolding(h, acc.id))
          })
        )
      : Promise.resolve([] as PromiseSettledResult<PortfolioHolding[]>[]),

    Promise.allSettled(directAccounts.map(acc => directHoldings(acc))),
  ])

  // Log failures so they're visible in Vercel runtime logs
  for (const r of [...adapterResults, ...directResults]) {
    if (r.status === 'rejected') console.error('[portfolio] broker fetch failed:', r.reason)
  }

  return [...settled(adapterResults), ...settled(directResults)]
}

// Per-request memoized wrapper. Multiple Suspense children that need the same
// portfolio (e.g. dashboard PortfolioLoader + AIInsightsLoader) share a single
// broker fetch instead of hitting the broker APIs twice. `key` makes the cache
// entry vary by account set; React's cache() dedupes within one render pass.
export const getBrokerPortfoliosCached = cache(
  async (_key: string, accounts: BrokerAccount[]) => getBrokerPortfolios(accounts)
)

export async function getPortfolioPerformance(holdings: PortfolioHolding[] = []): Promise<{
  totalValue: number
  totalInvested: number
  dailyChange: number
  dailyChangePercent: number
  overallGainLoss: number
  overallGainLossPercent: number
}> {
  let totalValue = 0, totalInvested = 0, overallGainLoss = 0, dailyChange = 0
  for (const h of holdings) {
    totalValue     += h.marketValue
    totalInvested  += h.avgPrice * h.quantity
    overallGainLoss += h.gainLoss
    dailyChange    += h.change * h.quantity
  }
  return {
    totalValue,
    totalInvested,
    dailyChange,
    dailyChangePercent:     totalValue    > 0 ? (dailyChange     / totalValue)    * 100 : 0,
    overallGainLoss,
    overallGainLossPercent: totalInvested > 0 ? (overallGainLoss / totalInvested) * 100 : 0,
  }
}
