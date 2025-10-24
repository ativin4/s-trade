'use client'

import { useState } from 'react'
import { Tabs, Tab, TabPanel } from '@/components/ui/tabs'
import { AIInsightCard } from '@/components/ai/ai-insight-card'
import { MarketSentimentCard } from '@/components/ai/market-sentiment-card'
import { PortfolioAnalysis } from '@/components/ai/portfolio-analysis'
import { TradingOpportunities } from '@/components/ai/trading-opportunities'
import { NewsSummary } from '@/components/ai/news-summary'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import { Badge } from '@/components/ui/badge'
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import type { AIAnalysisResponse, PortfolioHolding, NewsItem, UserSettings } from '@/app/types'

interface InsightsClientProps {
  validAnalyses: AIAnalysisResponse[];
  marketSentiment: {
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: number;
    factors: string[];
    reasoning: string;
  };
  portfolioHoldings: PortfolioHolding[];
  user: {
    id: string;
    name: string;
    settings: UserSettings;
  };
  newsSummary: {
    summary: string;
    keyPoints: string[];
    mentionedStocks: string[];
  };
  news: NewsItem[];
}

export function InsightsClient({ validAnalyses, marketSentiment, portfolioHoldings, user, newsSummary, news }: InsightsClientProps) {
    const [value, setValue] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <div className="space-y-6">
            <Tabs value={value} onChange={handleChange} aria-label="insights tabs">
                <Tab label="Overview" />
                <Tab label="Portfolio Analysis" />
                <Tab label="Opportunities" />
                <Tab label="Market Sentiment" />
                <Tab label="News" />
            </Tabs>
            <TabPanel value={value} index={0}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Insights</p>
                                    <p className="text-2xl font-bold">{validAnalyses.length}</p>
                                </div>
                                <PsychologyIcon className="w-8 h-8 text-primary" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Buy Signals</p>
                                    <p className="text-2xl font-bold text-bull-500">
                                        {validAnalyses.filter((a: AIAnalysisResponse) => a.recommendation === 'BUY' || a.recommendation === 'STRONG_BUY').length}
                                    </p>
                                </div>
                                <TrendingUpIcon className="w-8 h-8 text-bull-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Sell Signals</p>
                                    <p className="text-2xl font-bold text-bear-500">
                                        {validAnalyses.filter((a: AIAnalysisResponse) => a.recommendation === 'SELL' || a.recommendation === 'STRONG_SELL').length}
                                    </p>
                                </div>
                                <WarningIcon className="w-8 h-8 text-bear-500" />
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
                                            ? Math.round(validAnalyses.reduce((sum: number, a: AIAnalysisResponse) => sum + a.confidence, 0) / validAnalyses.length)
                                            : 0}%
                                    </p>
                                </div>
                                <TrackChangesIcon className="w-8 h-8 text-primary" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-4">Latest AI Insights</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {validAnalyses.slice(0, 6).map((analysis: AIAnalysisResponse) => (
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
            </TabPanel>
            <TabPanel value={value} index={1}>
                <PortfolioAnalysis
                    holdings={portfolioHoldings}
                    analyses={validAnalyses}
                    tradingPlan={null}
                />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <TradingOpportunities
                    suggestions={[]}
                    budget={user.settings?.maxBudgetPerTrade || 50000}
                    riskTolerance={user.settings?.riskTolerance as 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' || 'MODERATE'}
                />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MarketSentimentCard sentiment={marketSentiment} />
                    <Card>
                        <CardHeader>
                            <Typography variant='h6'>Market Analysis</Typography>
                            <Typography variant='body2'>
                                Current market conditions and key factors
                            </Typography>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">Key Factors</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {marketSentiment.factors.map((factor: string, index: number) => (
                                            <Badge key={index} variant="outline" label={factor} />
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
            </TabPanel>
            <TabPanel value={value} index={4}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <NewsSummary summary={newsSummary} />
                    <Card>
                        <CardHeader>
                            <Typography variant='h6'>Latest News</Typography>
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
            </TabPanel>
        </div>
    )
}
