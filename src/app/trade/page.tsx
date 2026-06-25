import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { TradeClient } from './trade-client'
import { mapPrismaToAppAccount } from '@/lib/broker'
import { mapPrismaToAppSettings } from '@/lib/user'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Trade } from '@/app/types'

export default async function TradePage(props: { searchParams: Promise<{ symbol?: string }> }) {
  const searchParams = await props.searchParams
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/')

  return (
    <PageWrapper>
      <PageHeader title="Trade" description="Market workspace — watchlist, charts, and order entry">
        <MarketStatusBadge />
      </PageHeader>
      <Suspense fallback={<TradingSkeleton />}>
        <TradingContent userId={session.user.id} symbol={searchParams?.symbol} />
      </Suspense>
    </PageWrapper>
  )
}

async function TradingContent({ userId, symbol }: { userId: string; symbol?: string }) {
  try {
    const [prismaAccounts, prismaSettings, recentTrades] = await Promise.all([
      prisma.brokerAccount.findMany({ where: { userId, isActive: true } }),
      prisma.userSettings.findUnique({ where: { userId } }),
      prisma.trade.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { brokerAccount: { select: { brokerName: true } } },
      }),
    ])

    const brokerAccounts = prismaAccounts.map(mapPrismaToAppAccount)
    const userSettings = mapPrismaToAppSettings(prismaSettings)

    return (
      <TradeClient
        userId={userId}
        brokerAccounts={brokerAccounts}
        recentTrades={recentTrades as (Trade & { brokerAccount: { brokerName: string } })[]}
        userSettings={userSettings}
        initialSymbol={symbol}
      />
    )
  } catch (err) {
    console.error('Trade page error:', err)
    return (
      <div className="bg-red-950/30 border border-red-800 rounded-xl p-6">
        <p className="text-red-400 font-medium">Unable to load trading workspace</p>
        <p className="text-red-500/60 text-sm mt-1">Refresh or contact support if this persists.</p>
      </div>
    )
  }
}

function MarketStatusBadge() {
  const now = new Date()
  const t = now.getHours() * 60 + now.getMinutes()
  const isOpen = t >= 9 * 60 + 15 && t <= 15 * 60 + 30
  return <Badge variant={isOpen ? 'default' : 'secondary'} label={isOpen ? 'Market Open' : 'Market Closed'} />
}

function TradingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_256px] gap-3">
      {[1, 2, 3].map(i => (
        <Card key={i} className="animate-pulse" style={{ minHeight: 480 }}>
          <CardHeader><div className="w-24 h-4 bg-muted rounded" /></CardHeader>
          <CardContent><div className="h-40 bg-muted rounded" /></CardContent>
        </Card>
      ))}
    </div>
  )
}
