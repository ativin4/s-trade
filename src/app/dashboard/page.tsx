import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { AppNav } from '@/components/layout/app-nav'
import { PortfolioOverview } from '@/components/dashboard/portfolio-overview'
import { AIInsights } from '@/components/dashboard/ai-insights'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { getBrokerPortfolios } from '@/lib/services/portfolio'
import { getAIInsights } from '@/lib/services/ai'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { RecentActivity } from '@/app/dashboard/recent-activity'
import { BrokerIntegration } from '@/components/dashboard/broker-integration'
import { LivePositions } from '@/components/dashboard/live-positions'
import { getBrokerAccounts } from '@/lib/broker'
import { mapPrismaToAppSettings } from '@/lib/user'

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, settings: true },
  })
  if (!user) return null
  const { settings, ...rest } = user
  return { user: rest, appSettings: mapPrismaToAppSettings(settings) }
}

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AppNav />
      <PageWrapper bare fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </PageWrapper>
    </div>
  )
}

async function DashboardContent() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) redirect('/')
    const userId = session.user.id

    // Only block on fast DB queries — broker API calls deferred to Suspense children
    const [userData, brokerAccounts] = await Promise.all([
      getUserData(userId),
      getBrokerAccounts(userId),
    ])
    if (!userData) redirect('/')

    const { user, appSettings } = userData

    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Hey, {user.name?.split(' ')[0] ?? 'Trader'} 👋</h1>
            <p className="text-sm text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
          </div>
          <QuickActions />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left — portfolio */}
          <div className="lg:col-span-2 space-y-5">
            <Suspense fallback={<PortfolioSkeleton />}>
              <PortfolioLoader brokerAccounts={brokerAccounts} />
            </Suspense>

            {/* Live positions — client polls independently */}
            <LivePositions initialPositions={[]} />

            {/* Recent activity */}
            <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800">
                <p className="text-xs font-bold text-white uppercase tracking-widest">Recent Activity</p>
              </div>
              <div className="p-5">
                <Suspense fallback={<p className="text-sm text-slate-600">Loading…</p>}>
                  <RecentActivity userId={userId} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Right — sidebar */}
          <div className="space-y-5">
            <BrokerIntegration brokerAccounts={brokerAccounts} />

            <Suspense fallback={<AIInsightsSkeleton />}>
              <AIInsightsLoader symbols={[]} appSettings={appSettings} />
            </Suspense>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-red-950/30 border border-red-800 rounded-xl p-6">
          <p className="text-red-400 font-medium">Unable to load dashboard</p>
          <p className="text-red-500/60 text-sm mt-1">Refresh or contact support if this persists.</p>
        </div>
      </div>
    )
  }
}

async function PortfolioLoader({ brokerAccounts }: { brokerAccounts: import('@/app/types').BrokerAccount[] }) {
  const holdings = await getBrokerPortfolios(brokerAccounts)
  return <PortfolioOverview holdings={holdings} brokerAccounts={brokerAccounts} />
}

function PortfolioSkeleton() {
  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden animate-pulse">
      <div className="grid grid-cols-4 divide-x divide-slate-800">
        {[1,2,3,4].map(i => (
          <div key={i} className="px-5 py-4">
            <div className="h-2 w-20 bg-slate-800 rounded mb-2" />
            <div className="h-6 w-28 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
      <div className="border-t border-slate-800 p-4 space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-800/60 rounded" />)}
      </div>
    </div>
  )
}

async function AIInsightsLoader({ symbols, appSettings }: { symbols: string[]; appSettings: ReturnType<typeof mapPrismaToAppSettings> }) {
  const insights = await getAIInsights(symbols, appSettings)
  return <AIInsights insights={insights} userPreferences={appSettings} />
}

function AIInsightsSkeleton() {
  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="h-3 w-20 bg-slate-800 rounded" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="px-5 py-3.5 border-b border-slate-800/50">
          <div className="flex justify-between mb-2">
            <div className="h-3 w-12 bg-slate-800 rounded" />
            <div className="h-3 w-10 bg-slate-800 rounded" />
          </div>
          <div className="h-2 w-full bg-slate-800/60 rounded" />
          <div className="h-2 w-3/4 bg-slate-800/60 rounded mt-1" />
        </div>
      ))}
    </div>
  )
}
