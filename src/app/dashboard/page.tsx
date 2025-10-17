import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
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
    // The PageWrapper ensures session exists, but we still need the ID for data fetching.
    // In a real app, you might get this from a shared server context.
    const { user: sessionUser } = (await (await import('next-auth')).getServerSession((await import('@/lib/auth')).authOptions))!
    const userId = sessionUser!.id!

    // Fetch user data and broker accounts
    const [user, brokerAccounts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { settings: true }
      }),
      prisma.brokerAccount.findMany({
        where: { userId, isActive: true }
      })
    ])

    if (!user) {
      redirect('/auth/signin')
    }

    // Fetch portfolio data from all connected brokers
    const portfolioData = await getBrokerPortfolios(brokerAccounts as BrokerAccount[])
    
    // Get AI insights for portfolio holdings
    const aiInsights = await getAIInsights(
      portfolioData.map(holding => holding.symbol),
      user.settings
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
              userPreferences={user.settings}
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