import { getTopGainersAndLosers } from '@/lib/services/market'

export async function TopMovers() {
  const { gainers, losers } = await getTopGainersAndLosers()

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Movers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-md font-semibold text-green-600 mb-2">Top Gainers</h3>
          <ul className="space-y-2">
            {gainers.map(stock => (
              <li key={stock.symbol} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{stock.symbol}</p>
                  <p className="text-sm text-gray-500">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{stock.price.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-green-600">+{stock.change.toLocaleString('en-IN')} ({stock.changePercent.toFixed(2)}%)</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-md font-semibold text-red-600 mb-2">Top Losers</h3>
          <ul className="space-y-2">
            {losers.map(stock => (
              <li key={stock.symbol} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{stock.symbol}</p>
                  <p className="text-sm text-gray-500">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{stock.price.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-red-600">{stock.change.toLocaleString('en-IN')} ({stock.changePercent.toFixed(2)}%)</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
