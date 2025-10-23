import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { PageWrapper } from '@/components/layout/page-wrapper'
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
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Search, BarChart3, Clock, Target } from 'lucide-react'
import type { BrokerAccount, Trade, UserSettings } from '@/types'

export default async function TradePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Trading"
        description="Execute trades and manage your positions"
      >
        <MarketStatusBadge />
      </PageHeader>
      <Suspense fallback={<TradingSkeleton />}>
        <TradingContent userId={session.user.id} />
      </Suspense>
    </PageWrapper>
  )
}

interface TradingContentProps {
  userId: string
}

async function TradingContent({ userId }: TradingContentProps) {
  // Mock data for now
  const mockSettings: UserSettings = {
    id: 'settings-id',
    userId: userId,
    maxBudgetPerTrade: 10000,
    riskTolerance: 'MODERATE',
    autoTradingEnabled: false,
    excludedSectors: [],
    preferredMarketCap: 'MULTI_CAP',
    otpMethod: 'EMAIL',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [user, brokerAccounts, recentTrades, { gainers, losers }] = await Promise.all([
    Promise.resolve({
      id: userId,
      name: 'Test User',
      settings: mockSettings,
    }),
    Promise.resolve([] as BrokerAccount[]),
    Promise.resolve([] as Trade[]),
    Promise.resolve({ gainers: [], losers: [] }),
  ])

  const totalBalance = brokerAccounts.reduce((sum, account) => sum + Number(account.balance), 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-2xl font-bold text-bull-500">
                ₹{totalBalance.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Available</p>
                <p className="font-semibold">₹{(totalBalance * 0.8).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Used</p>
                <p className="font-semibold">₹{(totalBalance * 0.2).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                Connected to {brokerAccounts.length} broker{brokerAccounts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>

        <QuickTrade brokerAccounts={brokerAccounts as BrokerAccount[]} />
        <ActiveOrders userId={userId} />
        <Watchlist userId={userId} />
      </div>

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

            <TradingPanel
              brokerAccounts={brokerAccounts as BrokerAccount[]}
              userSettings={user.settings}
            />

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
}

function MarketStatusBadge() {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinutes

  const marketOpen = 9 * 60 + 15
  const marketClose = 15 * 60 + 30

  const isMarketOpen = currentTime >= marketOpen && currentTime <= marketClose

  return (
    <Badge variant={isMarketOpen ? 'default' : 'secondary'} className="gap-1">
      <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-bull-500' : 'bg-muted-foreground'}`} />
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
        <h3 className="font-medium text-bull-500 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Top Gainers
        </h3>
        <div className="space-y-2">
          {gainers.map(stock => (
            <div key={stock.symbol} className="flex items-center justify-between p-2 bg-bull-500/10 rounded">
              <div>
                <p className="font-medium text-sm">{stock.symbol}</p>
                <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{stock.price}</p>
                <p className="text-sm text-bull-500">+{stock.changePercent}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-bear-500 mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4" />
          Top Losers
        </h3>
        <div className="space-y-2">
          {losers.map(stock => (
            <div key={stock.symbol} className="flex items-center justify-between p-2 bg-bear-500/10 rounded">
              <div>
                <p className="font-medium text-sm">{stock.symbol}</p>
                <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{stock.price}</p>
                <p className="text-sm text-bear-500">{stock.changePercent}%</p>
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
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="w-24 h-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="w-32 h-6 bg-muted rounded"></div>
                <div className="w-full h-3 bg-muted rounded"></div>
                <div className="w-3/4 h-3 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="lg:col-span-3">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="w-48 h-8 bg-muted rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}