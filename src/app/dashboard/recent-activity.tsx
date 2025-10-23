import { prisma } from '@/lib/auth'

interface RecentTrade {
  id: string;
  tradeType: string;
  symbol: string;
  quantity: number;
  price: number;
  createdAt: Date;
  brokerAccount: {
    brokerName: string;
  };
}

export async function RecentActivity({ userId }: { userId: string }) {
  const recentTrades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      brokerAccount: {
        select: { brokerName: true }
      }
    }
  })

  if (recentTrades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No recent trading activity</p>
        <p className="text-sm mt-1">Your trades will appear here once you start trading</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {recentTrades.map((trade: RecentTrade) => (
        <div
          key={trade.id}
          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
        >
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${
              trade.tradeType === 'BUY' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <div>
              <p className="font-medium text-gray-900">{trade.symbol}</p>
              <p className="text-sm text-gray-600">
                {trade.tradeType} {trade.quantity} shares @ ₹{trade.price}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {trade.brokerAccount.brokerName}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(trade.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}