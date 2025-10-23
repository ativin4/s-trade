import type { MarketData } from '@/app/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MarketSummaryProps {
  marketData?: MarketData
}

export function MarketSummary({ marketData }: MarketSummaryProps) {
  // Add a check for marketData to prevent errors if it's not available
  if (!marketData || !marketData.nifty50 || !marketData.sensex) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Market data is currently unavailable.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">NIFTY 50</p>
            <p className={cn('text-lg font-semibold', marketData.nifty50.change > 0 ? 'text-bull-500' : 'text-bear-500')}>
              {marketData.nifty50.value.toLocaleString('en-IN')}
            </p>
            <p className={cn('text-sm', marketData.nifty50.change > 0 ? 'text-bull-500' : 'text-bear-500')}>
              {marketData.nifty50.change > 0 ? '+' : ''}{marketData.nifty50.change.toLocaleString('en-IN')} ({marketData.nifty50.changePercent.toFixed(2)}%)
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">SENSEX</p>
            <p className={cn('text-lg font-semibold', marketData.sensex.change > 0 ? 'text-bull-500' : 'text-bear-500')}>
              {marketData.sensex.value.toLocaleString('en-IN')}
            </p>
            <p className={cn('text-sm', marketData.sensex.change > 0 ? 'text-bull-500' : 'text-bear-500')}>
              {marketData.sensex.change > 0 ? '+' : ''}{marketData.sensex.change.toLocaleString('en-IN')} ({marketData.sensex.changePercent.toFixed(2)}%)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}