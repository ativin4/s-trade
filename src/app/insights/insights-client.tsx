'use client'

import { useState } from 'react'
import { Tabs, Tab, TabPanel } from '@/components/ui/tabs'
import { AIInsightCard } from '@/components/ai/ai-insight-card'
import { MarketIdeasFeed } from '@/components/ai/market-ideas-feed'
import { PortfolioAnalysis } from '@/components/ai/portfolio-analysis'
import { TradingOpportunities } from '@/components/ai/trading-opportunities'
import { NewsSummary } from '@/components/ai/news-summary'
import type { AIAnalysisResponse, PortfolioHolding, NewsItem, UserSettings } from '@/app/types'

interface InsightsClientProps {
  validAnalyses: AIAnalysisResponse[]
  portfolioHoldings: PortfolioHolding[]
  user: { id: string; name: string; settings: UserSettings }
  newsSummary: { summary: string; keyPoints: string[]; mentionedStocks: string[] }
  news: NewsItem[]
}

const REC_COLOR: Record<string, string> = {
  BUY:        'text-emerald-400',
  STRONG_BUY: 'text-emerald-300',
  SELL:       'text-red-400',
  STRONG_SELL:'text-red-300',
  HOLD:       'text-slate-400',
}

export function InsightsClient({ validAnalyses, portfolioHoldings, user, newsSummary, news }: InsightsClientProps) {
  const [tab, setTab] = useState(0)

  const buys  = validAnalyses.filter(a => a.recommendation === 'BUY' || a.recommendation === 'STRONG_BUY').length
  const sells = validAnalyses.filter(a => a.recommendation === 'SELL' || a.recommendation === 'STRONG_SELL').length
  const avgConf = validAnalyses.length
    ? Math.round(validAnalyses.reduce((s, a) => s + a.confidence, 0) / validAnalyses.length)
    : 0

  return (
    <div className="space-y-6">
      <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="insights tabs">
        <Tab label="Market Ideas" />
        <Tab label="Overview" />
        <Tab label="Portfolio Analysis" />
        <Tab label="Opportunities" />
        <Tab label="News" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <MarketIdeasFeed />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Insights', value: validAnalyses.length, color: 'text-white' },
              { label: 'Buy Signals',    value: buys,                 color: 'text-emerald-400' },
              { label: 'Sell Signals',   value: sells,                color: 'text-red-400' },
              { label: 'Avg Confidence', value: `${avgConf}%`,        color: 'text-blue-400' },
            ].map(s => (
              <div key={s.label} className="bg-[#0f1117] border border-slate-800 rounded-xl px-5 py-4">
                <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Insight cards */}
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-4">Latest AI Insights</p>
            {validAnalyses.length === 0 ? (
              <div className="bg-[#0f1117] border border-slate-800 rounded-xl px-5 py-10 text-center">
                <p className="text-slate-600 text-sm">No insights yet</p>
                <p className="text-slate-700 text-xs mt-1">Add holdings to your portfolio to generate insights</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validAnalyses.slice(0, 6).map(a => (
                  <AIInsightCard
                    key={a.symbol}
                    analysis={a}
                    onAccept={() => {}}
                    onReject={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <PortfolioAnalysis holdings={portfolioHoldings} analyses={validAnalyses} />
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <TradingOpportunities
          suggestions={[]}
          budget={user.settings?.maxBudgetPerTrade || 50000}
          riskTolerance={(user.settings?.riskTolerance as 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE') || 'MODERATE'}
        />
      </TabPanel>

      <TabPanel value={tab} index={4}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NewsSummary summary={newsSummary} />
          <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <p className="text-xs font-bold text-white uppercase tracking-widest">Latest News</p>
            </div>
            <ul className="divide-y divide-slate-800/50">
              {news.map((item, i) => (
                <li key={i} className="px-5 py-3">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {item.title}
                  </a>
                  <p className="text-[11px] text-slate-600 mt-0.5">{item.source}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </TabPanel>
    </div>
  )
}
