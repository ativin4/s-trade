
import { unstable_cache } from 'next/cache'
import type { AIAnalysisResponse, UserSettings, NewsItem } from '@/app/types'
import { getGeminiInsights } from '@/lib/gemini'
import { fetchLtp } from './market-ltp'
import { fetchMarketNews } from './news'

// Cache per unique symbol set, revalidate every hour
const cachedGeminiInsights = unstable_cache(
  async (symbols: string[], settings: UserSettings | null) => {
    // Fetch real-time context for the prompt
    const [ltp, newsItems] = await Promise.all([
      fetchLtp(symbols).catch(() => ({})),
      fetchMarketNews(symbols).catch(() => [])
    ])

    // Group news by symbol
    const newsMap: Record<string, NewsItem[]> = {}
    for (const item of newsItems) {
      for (const s of item.symbols) {
        if (!newsMap[s]) newsMap[s] = []
        newsMap[s].push(item)
      }
    }

    return getGeminiInsights(symbols, settings, { ltp, news: newsMap })
  },
  ['gemini-insights'],
  { revalidate: 3600 }
)

export async function getAIInsights(
  symbols: string[],
  userSettings: UserSettings | null
): Promise<AIAnalysisResponse[]> {
  if (symbols.length === 0) return []
  return cachedGeminiInsights(symbols, userSettings)
}
