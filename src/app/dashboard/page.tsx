import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { PortfolioOverview } from '@/components/dashboard/portfolio-overview'
import { AIInsights } from '@/components/dashboard/ai-insights'
import { MarketSummary } from '@/components/dashboard/market-summary'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { getBrokerPortfolios } from '@/lib/services/portfolio'
import { getAIInsights } from '@/lib/services/ai'
import { getMarketData } from '@/lib/services/market'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { TopMovers } from '@/components/dashboard/top-movers'
import { RecentActivity } from '@/app/dashboard/recent-activity'
import type { BrokerAccount } from 'types-global'
import { mapPrismaSettingsToApp } from '@/lib/user'

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true },
  });

  if (!user) {
    return null;
  }

  const appSettings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  return {
    user,
    appSettings: mapPrismaSettingsToApp(appSettings),
  };
}

async function getBrokerAccounts(userId: string) {
  return prisma.brokerAccount.findMany({
    where: { userId },
  });
}

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <PageWrapper fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </PageWrapper>
    </div>
  )
}

interface DashboardContentProps {
  userId: string
}

async function DashboardContent() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      redirect('/auth/signin')
    }
    const userId = session.user.id

    const [userData, brokerAccounts] = await Promise.all([
      getUserData(userId),
      getBrokerAccounts(userId),
    ]);

    if (!userData) {
      redirect('/auth/signin')
    }

    const { user, appSettings } = userData;

    // Fetch portfolio data from all connected brokers
    const portfolioData = await getBrokerPortfolios(brokerAccounts as BrokerAccount[])
    
    // Get AI insights for portfolio holdings
    const aiInsights = await getAIInsights(
      portfolioData.map(holding => holding.symbol),
      appSettings
    )

    // Get current market data
    const marketData = await getMarketData()

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg border p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your trading dashboard for today
          </p>
        </div>

        {/* Quick Actions */}
        <QuickActions brokerAccounts={brokerAccounts as BrokerAccount[]} />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Overview - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <PortfolioOverview 
              holdings={portfolioData}
              brokerAccounts={brokerAccounts as BrokerAccount[]}
            />
          </div>

          {/* Market Summary - Takes 1 column */}
          <div className="space-y-6">
            <MarketSummary marketData={marketData} />
            <TopMovers />
            
            {/* AI Insights */}
            <AIInsights 
              insights={aiInsights}
              userPreferences={appSettings}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            <Suspense fallback={<div>Loading recent trades...</div>}>
              <RecentActivity userId={userId} />
            </Suspense>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-red-800 font-medium">Unable to load dashboard</h2>
        <p className="text-red-600 text-sm mt-1">
          Please refresh the page or contact support if the issue persists.
        </p>
      </div>
    )
  }
}