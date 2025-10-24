import { Card, CardContent, CardHeader} from '@/components/ui/card'
import type { StockData } from '@/types'
import Typography from '@mui/material/Typography'

export async function TopMovers() {
  // Mock data since the service is not implemented
  const { gainers, losers }: { gainers: StockData[], losers: StockData[] } = { gainers: [], losers: [] } // await getTopGainersAndLosers()

  return (
    <Card>
      <CardHeader>
        <Typography variant='h6'>Top Movers</Typography>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-semibold text-bull-500 mb-2">Top Gainers</h3>
            <ul className="space-y-2">
              {gainers.map(stock => (
                <li key={stock.symbol} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{stock.symbol}</p>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{stock.currentPrice.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-bull-500">+{stock.change.toLocaleString('en-IN')} ({stock.changePercent.toFixed(2)}%)</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-md font-semibold text-bear-500 mb-2">Top Losers</h3>
            <ul className="space-y-2">
              {losers.map(stock => (
                <li key={stock.symbol} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{stock.symbol}</p>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{stock.currentPrice.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-bear-500">{stock.change.toLocaleString('en-IN')} ({stock.changePercent.toFixed(2)}%)</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}