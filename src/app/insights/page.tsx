import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { getGeminiInsights } from '@/lib/gemini'
import { PageHeader } from '@/components/layout/page-header'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { InsightsClient } from './insights-client'
import { getBrokerPortfolios } from '@/lib/services/portfolio'
import { fetchMarketNews } from '@/lib/services/news'
import { mapPrismaToAppAccount } from '@/lib/broker'
import { mapPrismaToAppSettings } from '@/lib/user'
import type { AIAnalysisResponse, PortfolioHolding } from '@/app/types'

export default async function InsightsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/')

  return (
    <PageWrapper>
      <PageHeader
        title="AI Trading Insights"
        description="AI-powered analysis and recommendations for your portfolio"
      />
      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsContent userId={session.user.id} />
      </Suspense>
    </PageWrapper>
  )
}

async function InsightsContent({ userId }: { userId: string }) {
  try {
  const [prismaUser, prismaSettings, prismaAccounts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } }),
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.brokerAccount.findMany({ where: { userId, isActive: true } }),
  ])

  if (!prismaUser) redirect('/')

  const appSettings = mapPrismaToAppSettings(prismaSettings)
  const brokerAccounts = prismaAccounts.map(mapPrismaToAppAccount)
  const portfolioHoldings: PortfolioHolding[] = await getBrokerPortfolios(brokerAccounts)
  const symbols = portfolioHoldings.map(h => h.symbol)
  const news = await fetchMarketNews(symbols).catch(() => [])

  const newsMap: Record<string, import('@/app/types').NewsItem[]> = {}
  for (const item of news) {
    for (const s of item.symbols) {
      if (!newsMap[s]) newsMap[s] = []
      newsMap[s].push(item)
    }
  }

  const [validAnalyses] = await Promise.all([
    symbols.length > 0
      ? getGeminiInsights(symbols, appSettings, { news: newsMap }).catch(() => [] as AIAnalysisResponse[])
      : Promise.resolve([] as AIAnalysisResponse[]),
  ])

  const newsSummary = { summary: '', keyPoints: [], mentionedStocks: symbols }

  const user = {
    id: prismaUser.id,
    name: prismaUser.name ?? 'User',
    settings: appSettings ?? { id: '', userId, maxBudgetPerTrade: 50000, riskTolerance: 'MODERATE' as const, autoTradingEnabled: false, excludedSectors: [], preferredMarketCap: 'MULTI_CAP' as const, otpMethod: 'TOTP' as const, createdAt: new Date(), updatedAt: new Date() },
  }

  return (
    <InsightsClient
      validAnalyses={validAnalyses}
      portfolioHoldings={portfolioHoldings}
      user={user}
      newsSummary={newsSummary}
      news={news}
    />
  )
  } catch (err) {
    console.error('Insights page error:', err)
    return (
      <div className="bg-red-950/30 border border-red-800 rounded-xl p-6">
        <p className="text-red-400 font-medium">Unable to load insights</p>
        <p className="text-red-500/60 text-sm mt-1">Refresh or contact support if this persists.</p>
      </div>
    )
  }
}

function InsightsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-[#0f1117] border border-slate-800 rounded-xl px-5 py-4">
            <div className="h-2 w-16 bg-slate-800 rounded mb-3" />
            <div className="h-7 w-12 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 pt-4 pb-3 bg-slate-800/20">
              <div className="flex justify-between mb-2">
                <div className="h-5 w-20 bg-slate-800 rounded" />
                <div className="h-5 w-16 bg-slate-700 rounded-full" />
              </div>
              <div className="h-3 w-40 bg-slate-800/60 rounded" />
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-800/60 border-t border-slate-800/60">
              {[1,2,3].map(j => (
                <div key={j} className="px-3 py-2.5 text-center">
                  <div className="h-2 w-8 bg-slate-800/60 rounded mx-auto mb-2" />
                  <div className="h-4 w-16 bg-slate-800 rounded mx-auto" />
                </div>
              ))}
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="h-2 w-full bg-slate-800/50 rounded" />
              <div className="h-2 w-3/4 bg-slate-800/40 rounded" />
              <div className="h-1 w-full bg-slate-800/30 rounded-full mt-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
