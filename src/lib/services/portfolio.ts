
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

export interface BrokerFailure { broker: string; error: string }
export interface PortfolioResult { holdings: PortfolioHolding[]; failures: BrokerFailure[] }

// Brokers that bypass the adapter and hit their API directly
const DIRECT_API_BROKERS = new Set<string>()

async function directHoldings(account: BrokerAccount): Promise<PortfolioHolding[]> {
  switch (account.brokerName) {
    case 'groww':
      if (isGrowwMcp(account)) return getMcpPortfolio(account)
      return getGrowwHoldings(account)
    case '5paisa':
      return getFivePaisaHoldings(account)
    default:
      return []
  }
}

export async function getBrokerPortfolios(
  accounts: BrokerAccount[]
): Promise<PortfolioResult> {
  const adapterAvailable = brokerAdapter.available()

  const adapterAccounts = adapterAvailable
    ? accounts.filter(a => a.isAdapterActive && !DIRECT_API_BROKERS.has(a.brokerName))
    : []
  const directAccounts = accounts.filter(
    a => !adapterAvailable || !a.isAdapterActive || DIRECT_API_BROKERS.has(a.brokerName)
  )

  // Run all accounts independently — one failure never blocks another
  const allResults: { acc: BrokerAccount; result: PromiseSettledResult<PortfolioHolding[]> }[] = []

  const [adapterSettled, directSettled] = await Promise.all([
    adapterAccounts.length
      ? Promise.allSettled(
          adapterAccounts.map(async (acc) => {
            try {
              const items = await brokerAdapter.holdings(acc.brokerName.toLowerCase())
              if (items.length > 0) return items.map(h => toPortfolioHolding(h, acc.id))
            } catch { /* fall through to direct */ }
            console.warn('[portfolio] adapter empty/failed, using direct for', acc.brokerName)
            return directHoldings(acc)
          })
        )
      : Promise.resolve([] as PromiseSettledResult<PortfolioHolding[]>[]),

    Promise.allSettled(directAccounts.map(acc => directHoldings(acc))),
  ])

  adapterAccounts.forEach((acc, i) => allResults.push({ acc, result: adapterSettled[i]! }))
  directAccounts.forEach((acc, i)  => allResults.push({ acc, result: directSettled[i]! }))

  const holdings: PortfolioHolding[] = []
  const failures: BrokerFailure[] = []

  for (const { acc, result } of allResults) {
    if (result.status === 'fulfilled') {
      holdings.push(...result.value)
    } else {
      const msg = (result.reason as Error)?.message ?? String(result.reason)
      console.error(`[portfolio] ${acc.brokerName} failed:`, msg)
      failures.push({ broker: acc.brokerName, error: msg })
    }
  }

  return { holdings, failures }
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
