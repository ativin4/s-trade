import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GeminiAIService } from '@/lib/services/gemini'
import { PageHeader } from '@/components/layout/page-header'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { InsightsClient } from './insights-client'
import type { AIAnalysisResponse, BrokerAccount, PortfolioHolding, MarketData, NewsItem, TechnicalIndicators, UserSettings } from '@/app/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Typography from '@mui/material/Typography'

export default async function InsightsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const mockSettings: UserSettings = {
    id: 'settings-id',
    userId: session.user.id,
    riskTolerance: 'MODERATE',
    maxBudgetPerTrade: 50000,
    preferredMarketCap: 'LARGE_CAP',
    autoTradingEnabled: false,
    excludedSectors: [],
    otpMethod: 'EMAIL',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock data for now
  const [user, brokerAccounts, portfolioHoldings, marketData, news] = await Promise.all([
    Promise.resolve({
      id: session.user.id,
      name: 'Test User',
      settings: mockSettings,
    }),
    Promise.resolve([] as BrokerAccount[]),
    Promise.resolve([] as PortfolioHolding[]),
    Promise.resolve({} as MarketData),
    Promise.resolve([] as NewsItem[]),
  ])
  const aiService = new GeminiAIService()
  const marketSentiment = await aiService.getMarketSentiment(marketData as MarketData)
  const holdingAnalyses = await Promise.all(
    portfolioHoldings.map((holding: PortfolioHolding) =>
      aiService.analyzeStock({
        symbol: holding.symbol,
        currentPrice: holding.currentPrice ?? 0,
        historicalData: [],
        newsData: [],
        technicalIndicators: {} as TechnicalIndicators,
        userSettings: user.settings,
      })
    )
  )
  const validAnalyses = holdingAnalyses.filter(Boolean) as AIAnalysisResponse[]
  const newsSummary = await aiService.summarizeNews(news)

  return (
    <PageWrapper>
      <PageHeader
        title="AI Trading Insights"
        description="AI-powered analysis and recommendations for your portfolio"
      />
      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsClient {...{ validAnalyses, marketSentiment, portfolioHoldings, user, newsSummary, news }} />
      </Suspense>
    </PageWrapper>
  )
}

function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="w-20 h-3 bg-muted rounded"></div>
                  <div className="w-12 h-6 bg-muted rounded"></div>
                </div>
                <div className="w-8 h-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="w-32 h-5 bg-muted rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="w-24 h-4 bg-muted rounded"></div>
                <div className="w-32 h-3 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="w-full h-3 bg-muted rounded"></div>
                  <div className="w-3/4 h-3 bg-muted rounded"></div>
                  <div className="flex gap-2 mt-4">
                    <div className="w-16 h-8 bg-muted rounded"></div>
                    <div className="w-16 h-8 bg-muted rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}