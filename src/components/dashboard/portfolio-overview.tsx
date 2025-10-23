
import type { PortfolioHolding, BrokerAccount } from '@/app/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PortfolioOverviewProps {
  holdings: PortfolioHolding[]
  brokerAccounts: BrokerAccount[]
}

export function PortfolioOverview({ holdings, brokerAccounts }: PortfolioOverviewProps) {
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
  const totalDailyChange = holdings.reduce((sum, h) => sum + h.change * h.quantity, 0)
  const dailyChangePercent = totalValue > 0 ? (totalDailyChange / (totalValue - totalDailyChange)) * 100 : 0

  const brokerData = brokerAccounts.map(account => {
    const accountHoldings = holdings.filter(h => h.brokerAccountId === account.id)
    const accountValue = accountHoldings.reduce((sum, h) => sum + h.marketValue, 0)
    return { ...account, holdingCount: accountHoldings.length, value: accountValue }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">₹{totalValue.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Daily Gain/Loss</p>
            <p className={cn('text-2xl font-bold', totalDailyChange >= 0 ? 'text-bull-500' : 'text-bear-500')}>
              {totalDailyChange >= 0 ? '+' : ''}₹{totalDailyChange.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Daily Change %</p>
            <p className={cn('text-2xl font-bold', dailyChangePercent >= 0 ? 'text-bull-500' : 'text-bear-500')}>
              {dailyChangePercent.toFixed(2)}%
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold mb-3">By Broker</h3>
          <div className="space-y-3">
            {brokerData.map(account => (
              <div key={account.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                <div>
                  <p className="font-medium">{account.provider}</p>
                  <p className="text-sm text-muted-foreground">{account.holdingCount} holdings</p>
                </div>
                <p className="font-semibold">₹{account.value.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
