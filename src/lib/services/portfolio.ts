
import type { BrokerAccount, PortfolioHolding } from '@/app/types'
import { getGrowwHoldings } from '@/lib/services/groww'
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

export async function getBrokerPortfolios(
  accounts: BrokerAccount[]
): Promise<PortfolioHolding[]> {
  const syncedAccounts    = accounts.filter(a => a.isAdapterActive)
  const nonSyncedAccounts = accounts.filter(a => !a.isAdapterActive)

  // Adapter-synced and fallback paths are independent — run in parallel
  const [adapterResults, fallbackResults] = await Promise.all([
    brokerAdapter.available()
      ? Promise.allSettled(
          syncedAccounts.map(async (acc) => {
            const items = await brokerAdapter.holdings(acc.brokerName.toLowerCase())
            return items.map(h => toPortfolioHolding(h, acc.id))
          })
        )
      : Promise.resolve([] as PromiseSettledResult<PortfolioHolding[]>[]),

    Promise.allSettled(
      nonSyncedAccounts.map(async (account) => {
        switch (account.brokerName) {
          case 'groww':
            // isGrowwMcp: legacy MCP-sentinel accounts return empty; real API handled by adapter
            if (isGrowwMcp(account)) return [] as PortfolioHolding[]
            return getGrowwHoldings(account)
          case 'zerodha':
            return getMcpPortfolio(account)
          default:
            return [] as PortfolioHolding[]
        }
      })
    ),
  ])

  return [...settled(adapterResults), ...settled(fallbackResults)]
}

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
