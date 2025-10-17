import type { MarketData } from '@/app/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MarketSummaryProps {
  marketData: MarketData
}

export function MarketSummary({ marketData }: MarketSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">NIFTY 50</p>
            <p className={`text-lg font-semibold ${marketData.nifty50.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {marketData.nifty50.value.toLocaleString('en-IN')}
            </p>
            <p className={`text-sm ${marketData.nifty50.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {marketData.nifty50.change > 0 ? '+' : ''}{marketData.nifty50.change.toLocaleString('en-IN')} ({marketData.nifty50.changePercent.toFixed(2)}%)
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">SENSEX</p>
            <p className={`text-lg font-semibold ${marketData.sensex.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {marketData.sensex.value.toLocaleString('en-IN')}
            </p>
            <p className={`text-sm ${marketData.sensex.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {marketData.sensex.change > 0 ? '+' : ''}{marketData.sensex.change.toLocaleString('en-IN')} ({marketData.sensex.changePercent.toFixed(2)}%)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
