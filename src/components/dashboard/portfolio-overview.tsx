import type { PortfolioHolding, BrokerAccount } from '@/app/types'

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
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">₹{totalValue.toLocaleString('en-IN')}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Daily Gain/Loss</p>
          <p className={`text-2xl font-bold ${totalDailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalDailyChange >= 0 ? '+' : ''}₹{totalDailyChange.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Daily Change %</p>
          <p className={`text-2xl font-bold ${dailyChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {dailyChangePercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-md font-semibold text-gray-800 mb-3">By Broker</h3>
        <div className="space-y-3">
          {brokerData.map(account => (
            <div key={account.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <div>
                <p className="font-medium text-gray-900">{account.name}</p>
                <p className="text-sm text-gray-500">{account.holdingCount} holdings</p>
              </div>
              <p className="font-semibold text-gray-900">₹{account.value.toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}