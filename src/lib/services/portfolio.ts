
import type { BrokerAccount, PortfolioHolding } from '@/app/types'

import { getMcpPortfolio } from '@/lib/mcp'

export async function getBrokerPortfolios(
  accounts: BrokerAccount[]
): Promise<PortfolioHolding[]> {
  const portfolioPromises = accounts.map(async (account) => {
    if (account.brokerName === 'zerodha') {
      return getMcpPortfolio(account)
    }
    // In a real app, you would make API calls to the respective brokers
    // and aggregate the portfolio data.
    // For now, we return mock data for other brokers.
    return [
      {
        symbol: 'RELIANCE',
        name: 'Reliance Industries',
        quantity: 10,
        avgPrice: 2800,
        currentPrice: 2850,
        change: 50,
        changePercent: 1.78,
        marketValue: 28500,
        gainLoss: 500,
        gainLossPercent: 1.78,
        aiRecommendation: 'HOLD',
        confidence: 0.7,
        insight: 'Reliance is expected to perform well in the coming weeks.',
        brokerAccountId: account.id,
      },
      {
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        quantity: 20,
        avgPrice: 3800,
        currentPrice: 3850,
        change: 50,
        changePercent: 1.31,
        marketValue: 77000,
        gainLoss: 1000,
        gainLossPercent: 1.31,
        aiRecommendation: 'BUY',
        confidence: 0.8,
        insight: 'TCS is showing strong buy signals.',
        brokerAccountId: account.id,
      },
    ]
  })

  const portfolios = await Promise.all(portfolioPromises)
  return portfolios.flat()
}
export async function getPortfolioPerformance(): Promise<{
  totalValue: number
  dailyChange: number
  dailyChangePercent: number
  overallGainLoss: number
  overallGainLossPercent: number
}> {
  // Mock data - replace with actual calculations
  return {
    totalValue: 105500,
    dailyChange: 1500,
    dailyChangePercent: 1.44,
    overallGainLoss: 1500,
    overallGainLossPercent: 1.44,
  }
}
