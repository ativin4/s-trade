import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AIInsightCard } from '@/components/ai/ai-insight-card'
import { MarketSentimentCard } from '@/components/ai/market-sentiment-card'
import { PortfolioAnalysis } from '@/components/ai/portfolio-analysis'
import { TradingOpportunities } from '@/components/ai/trading-opportunities'
import { InsightFilters } from '@/components/ai/insight-filters'
import { RefreshInsightsButton } from '@/components/ai/refresh-insights-button'
import { GeminiAIService } from '@/lib/services/gemini'
import { getBrokerPortfolios } from '@/lib/services/portfolio'
import { getMarketData, getNews } from '@/lib/services/market'
import { NewsSummary } from '@/components/ai/news-summary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp, AlertTriangle, Target, RefreshCw } from 'lucide-react'
import type { AIAnalysisResponse, BrokerAccount, PortfolioHolding, MarketData } from '@/types'

export default async function InsightsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            AI Trading Insights
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered analysis and recommendations for your portfolio
          </p>
        </div>
        <RefreshInsightsButton />
      </div>

      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsContent userId={session.user.id} />
      </Suspense>
    </div>
  )
}

interface InsightsContentProps {
  userId: string
}

async function InsightsContent({ userId }: InsightsContentProps) {
  try {
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

    // Get portfolio holdings and market data
    const [portfolioHoldings, marketData] = await Promise.all([
      getBrokerPortfolios(brokerAccounts as BrokerAccount[]),
      getMarketData()
    ])

    // Generate AI insights
    const aiService = new GeminiAIService()
    
    // Get market sentiment
    const marketSentiment = await aiService.getMarketSentiment(marketData)
    
    // Analyze each holding
    const holdingAnalyses = await Promise.all(
      portfolioHoldings.slice(0, 10).map(async (holding) => {
        try {
          // Get stock data for analysis (this would be implemented with real data sources)
          const stockData = {
            symbol: holding.symbol,
            currentPrice: holding.currentPrice,
            historicalData: [], // Would be populated with real historical data
            technicalIndicators: undefined,
            userSettings: user.settings
          }
          
          return await aiService.analyzeStock(stockData)
        } catch (error) {
          console.error(`Failed to analyze ${holding.symbol}:`, error)
          return null
        }
      })
    )

    const validAnalyses = holdingAnalyses.filter(Boolean) as AIAnalysisResponse[]

    // Generate trading plan
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
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Insights</p>
                    <p className="text-2xl font-bold">{validAnalyses.length}</p>
                  </div>
                  <Brain className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Buy Signals</p>
                    <p className="text-2xl font-bold text-green-600">
                      {validAnalyses.filter(a => a.recommendation === 'BUY' || a.recommendation === 'STRONG_BUY').length}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sell Signals</p>
                    <p className="text-2xl font-bold text-red-600">
                      {validAnalyses.filter(a => a.recommendation === 'SELL' || a.recommendation === 'STRONG_SELL').length}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Confidence</p>
                    <p className="text-2xl font-bold">
                      {validAnalyses.length > 0 
                        ? Math.round(validAnalyses.reduce((sum, a) => sum + a.confidence, 0) / validAnalyses.length)
                        : 0}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Insights */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Latest AI Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {validAnalyses.slice(0, 6).map((analysis) => (
                <AIInsightCard 
                  key={analysis.symbol} 
                  analysis={analysis}
                  onAccept={() => {
                    // Handle accepting recommendation
                    console.log('Accepted recommendation for', analysis.symbol)
                  }}
                  onReject={() => {
                    // Handle rejecting recommendation  
                    console.log('Rejected recommendation for', analysis.symbol)
                  }}
                />
              ))}
            </div>
          </div>

          {/* Market Sentiment */}
          <MarketSentimentCard sentiment={marketSentiment} />
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <PortfolioAnalysis 
            holdings={portfolioHoldings}
            analyses={validAnalyses}
            tradingPlan={tradingPlan}
          />
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <TradingOpportunities 
            suggestions={tradingPlan.suggestions}
            budget={user.settings?.maxBudgetPerTrade || 50000}
            riskTolerance={user.settings?.riskTolerance || 'MODERATE'}
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
                    <p className="text-sm text-gray-600">
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
                  {news.map((item, index) => (
                    <li key={index}>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">{item.title}</a>
                      <p className="text-sm text-gray-500">{item.source}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    )
  } catch (error) {
    console.error('Insights page error:', error)
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">Unable to Load Insights</h3>
              <p className="text-sm text-red-700 mt-1">
                There was an error generating AI insights. Please try again later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
}

function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="w-20 h-3 bg-gray-200 rounded"></div>
                  <div className="w-12 h-6 bg-gray-200 rounded"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights Skeleton */}
      <div>
        <div className="w-32 h-5 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="w-32 h-3 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="w-full h-3 bg-gray-200 rounded"></div>
                  <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                  <div className="flex gap-2 mt-4">
                    <div className="w-16 h-8 bg-gray-200 rounded"></div>
                    <div className="w-16 h-8 bg-gray-200 rounded"></div>
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