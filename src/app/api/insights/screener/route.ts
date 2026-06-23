import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGeminiInsights } from '@/lib/gemini'
import { runScreeners, type ScreenResult, type ScreenType } from '@/lib/services/screener'
import { fetchMarketNews } from '@/lib/services/news'
import type { AIAnalysisResponse, NewsItem } from '@/app/types'

// ISR: serve stale, regenerate in background (no force-dynamic — keep caching on).
export const revalidate = 3600
export const maxDuration = 60

interface ScreenerPayload {
  ideas: AIAnalysisResponse[]
  screenedAt: string
  screens: ScreenResult[]
}

// Simple in-memory cache (2 hours). Screener results are market-wide and
// independent of the requesting user, so a single shared entry is fine.
const CACHE_TTL_MS = 2 * 60 * 60 * 1000
let _cache: { ts: number; payload: ScreenerPayload } | null = null

const MAX_PER_SCREEN = 2
const MAX_SYMBOLS = 10

// Keep at most N results per screen type, capped at MAX_SYMBOLS total.
function topResults(results: ScreenResult[]): ScreenResult[] {
  const perScreen: Record<ScreenType, ScreenResult[]> = {
    MOMENTUM_BREAKOUT: [],
    OVERSOLD_REVERSAL: [],
    MACD_CROSSOVER: [],
    VOLUME_SURGE: [],
  }
  for (const r of results) perScreen[r.screen].push(r)

  // Rank within each screen by a relevance proxy (volume surge first, then
  // larger absolute move) so the strongest signals survive the cap.
  for (const key of Object.keys(perScreen) as ScreenType[]) {
    perScreen[key].sort((a, b) => {
      const vr = (b.volumeRatio ?? 0) - (a.volumeRatio ?? 0)
      if (vr !== 0) return vr
      return Math.abs(b.changePercent) - Math.abs(a.changePercent)
    })
  }

  const picked: ScreenResult[] = []
  const seen = new Set<string>()
  for (const key of Object.keys(perScreen) as ScreenType[]) {
    for (const r of perScreen[key].slice(0, MAX_PER_SCREEN)) {
      if (seen.has(r.symbol)) continue
      seen.add(r.symbol)
      picked.push(r)
    }
  }
  return picked.slice(0, MAX_SYMBOLS)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (_cache && Date.now() - _cache.ts < CACHE_TTL_MS) {
    return NextResponse.json(_cache.payload)
  }

  try {
    const allScreens = await runScreeners()
    const screens = topResults(allScreens)

    let ideas: AIAnalysisResponse[] = []
    if (screens.length > 0) {
      const ltp: Record<string, { price: number; change: number; changePercent: number }> = {}
      for (const s of screens) {
        ltp[s.symbol] = { price: s.price, change: s.change, changePercent: s.changePercent }
      }

      const news = await fetchMarketNews(screens.map((s) => s.symbol)).catch(() => [])
      const newsMap: Record<string, NewsItem[]> = {}
      for (const item of news) {
        for (const s of item.symbols) {
          if (!newsMap[s]) newsMap[s] = []
          newsMap[s].push(item)
        }
      }

      ideas = await getGeminiInsights(
        screens.map((s) => s.symbol),
        null,
        { ltp, news: newsMap }
      ).catch(() => [] as AIAnalysisResponse[])
    }

    const payload: ScreenerPayload = {
      ideas,
      screenedAt: new Date().toISOString(),
      screens,
    }
    _cache = { ts: Date.now(), payload }
    return NextResponse.json(payload)
  } catch (err) {
    console.error('Screener route error:', err)
    return NextResponse.json(
      { ideas: [], screenedAt: new Date().toISOString(), screens: [] } satisfies ScreenerPayload,
      { status: 200 }
    )
  }
}
