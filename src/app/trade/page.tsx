import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StockSearch } from '@/components/trading/stock-search'
import { TradingPanel } from '@/components/trading/trading-panel'
import { OrderBook } from '@/components/trading/order-book'
import { StockChart } from '@/components/trading/stock-chart'
import { TradeHistory } from '@/components/trading/trade-history'
import { Watchlist } from '@/components/trading/watchlist'
import { QuickTrade } from '@/components/trading/quick-trade'
import { MarketDepth } from '@/components/trading/market-depth'
import { ActiveOrders } from '@/components/trading/active-orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  BarChart3, 
  Clock, 
  Target,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import type { BrokerAccount, Trade, PortfolioHolding } from '@/types'
import { getTopGainersAndLosers } from '@/lib/services/market'

export default async function TradePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-green-600" />
            Trading
          </h1>
          <p className="text-gray-600 mt-1">
            Execute trades and manage your positions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MarketStatusBadge />
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Suspense fallback={<TradingSkeleton />}>
        <TradingContent userId={session.user.id} />
      </Suspense>
    </div>
  )
}

interface TradingContentProps {
  userId: string
}

async function TradingContent({ userId }: TradingContentProps) {
  try {
    // Fetch user data and broker accounts
    const [user, brokerAccounts, recentTrades, { gainers, losers }] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { settings: true }
      }),
      prisma.brokerAccount.findMany({
        where: { userId, isActive: true }
      }),
      prisma.trade.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          brokerAccount: {
            select: { brokerName: true }
          }
        }
      }),
      getTopGainersAndLosers()
    ])

    if (!user) {
      redirect('/auth/signin')
    }

    const totalBalance = brokerAccounts.reduce((sum, account) => 
      sum + Number(account.balance), 0
    )

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Quick Info */}
        <div className="space-y-6">
          {/* Account Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{totalBalance.toLocaleString('en-IN')}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Available</p>
                  <p className="font-semibold">₹{(totalBalance * 0.8).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Used</p>
                  <p className="font-semibold">₹{(totalBalance * 0.2).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-gray-500">
                  Connected to {brokerAccounts.length} broker{brokerAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Trade */}
          <QuickTrade brokerAccounts={brokerAccounts as BrokerAccount[]} />

          {/* Active Orders */}
          <ActiveOrders userId={userId} />

          {/* Watchlist */}
          <Watchlist userId={userId} />
        </div>

        {/* Main Trading Area */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="search" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="search">
                <Search className="w-4 h-4 mr-2" />
                Search & Trade
              </TabsTrigger>
              <TabsTrigger value="chart">
                <BarChart3 className="w-4 h-4 mr-2" />
                Charts
              </TabsTrigger>
              <TabsTrigger value="orders">
                <Target className="w-4 h-4 mr-2" />
                Order Book
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-6">
              {/* Stock Search */}
              <Card>
                <CardHeader>
                  <CardTitle>Search Stocks</CardTitle>
                  <CardDescription>
                    Search for stocks and view real-time prices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StockSearch />
                </CardContent>
              </Card>

              {/* Trading Panel */}
              <TradingPanel 
                brokerAccounts={brokerAccounts as BrokerAccount[]}
                userSettings={user.settings}
              />

              {/* Market Movers */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Movers</CardTitle>
                  <CardDescription>Top gainers and losers today</CardDescription>
                </CardHeader>
                <CardContent>
                  <MarketMovers gainers={gainers} losers={losers} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chart" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Chart</CardTitle>
                  <CardDescription>
                    Interactive price charts with technical indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StockChart symbol="RELIANCE.NS" height={400} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OrderBook symbol="RELIANCE.NS" />
                <MarketDepth symbol="RELIANCE.NS" />
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <TradeHistory trades={recentTrades as (Trade & { brokerAccount: { brokerName: string } })[]} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Trading page error:', error)
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">Unable to Load Trading Interface</h3>
              <p className="text-sm text-red-700 mt-1">
                There was an error loading the trading interface. Please try again later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
}

function MarketStatusBadge() {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinutes

  // Market hours: 9:15 AM to 3:30 PM
  const marketOpen = 9 * 60 + 15  // 9:15 AM
  const marketClose = 15 * 60 + 30 // 3:30 PM

  const isMarketOpen = currentTime >= marketOpen && currentTime <= marketClose

  return (
    <Badge variant={isMarketOpen ? "default" : "secondary"} className="gap-1">
      <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-green-400' : 'bg-gray-400'}`} />
      Market {isMarketOpen ? 'Open' : 'Closed'}
    </Badge>
  )
}

function MarketMovers({ gainers, losers }: {
  gainers: Array<{ symbol: string; name: string; price: number; change: number; changePercent: number }>
  losers: Array<{ symbol: string; name: string; price: number; change: number; changePercent: number }>
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-medium text-green-700 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Top Gainers
        </h3>
        <div className="space-y-2">
          {gainers.map((stock) => (
            <div key={stock.symbol} className="flex items-center justify-between p-2 bg-green-50 rounded">
              <div>
                <p className="font-medium text-sm">{stock.symbol}</p>
                <p className="text-xs text-gray-600 truncate">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{stock.price}</p>
                <p className="text-sm text-green-600">+{stock.changePercent}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-red-700 mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4" />
          Top Losers
        </h3>
        <div className="space-y-2">
          {losers.map((stock) => (
            <div key={stock.symbol} className="flex items-center justify-between p-2 bg-red-50 rounded">
              <div>
                <p className="font-medium text-sm">{stock.symbol}</p>
                <p className="text-xs text-gray-600 truncate">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{stock.price}</p>
                <p className="text-sm text-red-600">{stock.changePercent}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TradingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="w-32 h-6 bg-gray-200 rounded"></div>
                <div className="w-full h-3 bg-gray-200 rounded"></div>
                <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="lg:col-span-3">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="w-48 h-8 bg-gray-200 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
