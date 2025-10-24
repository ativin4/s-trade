import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { Watchlist } from '@/components/trading/watchlist'
import { QuickTrade } from '@/components/trading/quick-trade'
import { ActiveOrders } from '@/components/trading/active-orders'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import { Badge } from '@/components/ui/badge'
import { TradeClient } from './trade-client'
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
            <Typography variant='h6'>Account Summary</Typography>
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

      <TradeClient userId={userId} user={user} brokerAccounts={brokerAccounts} recentTrades={recentTrades as (Trade & { brokerAccount: { brokerName: string } })[]} gainers={gainers} losers={losers} />
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
    <Badge variant={isMarketOpen ? 'default' : 'secondary'} label={isMarketOpen ? 'Market Open' : 'Market Closed'} />
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
