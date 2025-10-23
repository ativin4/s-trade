import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GeminiAIService } from '@/lib/services/gemini'
import { PageHeader } from '@/components/layout/page-header'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { AIInsightCard } from '@/components/ai/ai-insight-card'
import { MarketSentimentCard } from '@/components/ai/market-sentiment-card'
import { PortfolioAnalysis } from '@/components/ai/portfolio-analysis'
import { TradingOpportunities } from '@/components/ai/trading-opportunities'
import { NewsSummary } from '@/components/ai/news-summary'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp, AlertTriangle, Target } from 'lucide-react'
import type { AIAnalysisResponse, BrokerAccount, PortfolioHolding, MarketData, NewsItem, TechnicalIndicators, UserSettings } from '@/app/types'

export default async function InsightsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

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

interface InsightsContentProps {
  userId: string
}

async function InsightsContent({ userId }: InsightsContentProps) {
  const mockSettings: UserSettings = {
    id: 'settings-id',
    userId: userId,
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
      id: userId,
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
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="portfolio">Portfolio Analysis</TabsTrigger>
        <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        <TabsTrigger value="market">Market Sentiment</TabsTrigger>
        <TabsTrigger value="news">News</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Insights</p>
                  <p className="text-2xl font-bold">{validAnalyses.length}</p>
                </div>
                <Brain className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Buy Signals</p>
                  <p className="text-2xl font-bold text-bull-500">
                    {validAnalyses.filter(a => a.recommendation === 'BUY' || a.recommendation === 'STRONG_BUY').length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-bull-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sell Signals</p>
                  <p className="text-2xl font-bold text-bear-500">
                    {validAnalyses.filter(a => a.recommendation === 'SELL' || a.recommendation === 'STRONG_SELL').length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-bear-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Confidence</p>
                  <p className="text-2xl font-bold">
                    {validAnalyses.length > 0
                      ? Math.round(validAnalyses.reduce((sum, a) => sum + a.confidence, 0) / validAnalyses.length)
                      : 0}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Latest AI Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validAnalyses.slice(0, 6).map(analysis => (
              <AIInsightCard
                key={analysis.symbol}
                analysis={analysis}
                onAccept={() => console.log('Accepted recommendation for', analysis.symbol)}
                onReject={() => console.log('Rejected recommendation for', analysis.symbol)}
              />
            ))}
          </div>
        </div>

        <MarketSentimentCard sentiment={marketSentiment} />
      </TabsContent>

      <TabsContent value="portfolio" className="space-y-6">
        <PortfolioAnalysis
          holdings={portfolioHoldings}
          analyses={validAnalyses}
          tradingPlan={null} // tradingPlan is not defined in the original code
        />
      </TabsContent>

      <TabsContent value="opportunities" className="space-y-6">
        <TradingOpportunities
          suggestions={[]}
          budget={user.settings?.maxBudgetPerTrade || 50000}
          riskTolerance={user.settings?.riskTolerance as 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' || 'MODERATE'}
        />
      </TabsContent>

      <TabsContent value="market" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketSentimentCard sentiment={marketSentiment} />

          <Card>
            <CardHeader>
              <CardTitle>Market Analysis</CardTitle>
              <CardDescription>
                Current market conditions and key factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Key Factors</h4>
                  <div className="flex flex-wrap gap-2">
                    {marketSentiment.factors.map((factor, index) => (
                      <Badge key={index} variant="outline">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    {marketSentiment.reasoning}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="news" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NewsSummary summary={newsSummary} />
          <Card>
            <CardHeader>
              <CardTitle>Latest News</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {news.map((item: NewsItem, index: number) => (
                  <li key={index}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{item.title}</a>
                    <p className="text-sm text-muted-foreground">{item.source}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
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
