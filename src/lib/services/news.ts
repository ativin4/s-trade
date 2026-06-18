import type { NewsItem } from '@/app/types'

const ITEM_RE = /<item>([\s\S]*?)<\/item>/g
const TITLE_RE = /<title>([\s\S]*?)<\/title>/
const LINK_RE = /<link>([\s\S]*?)<\/link>/
const PUBDATE_RE = /<pubDate>([\s\S]*?)<\/pubDate>/
const SOURCE_RE = /<source[^>]*>([\s\S]*?)<\/source>/

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

async function fetchGoogleNewsRss(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) return []
  const xml = await res.text()

  const items: NewsItem[] = []
  for (const match of xml.matchAll(ITEM_RE)) {
    const block = match[1]!
    const rawTitle = TITLE_RE.exec(block)?.[1]
    const link = LINK_RE.exec(block)?.[1]
    const pubDate = PUBDATE_RE.exec(block)?.[1]
    const source = SOURCE_RE.exec(block)?.[1]
    if (!rawTitle || !link) continue

    const decodedTitle = decodeEntities(rawTitle)
    // Google News titles are formatted "Headline - Publisher"; strip the trailing publisher.
    const title = source ? decodedTitle.replace(new RegExp(`\\s*-\\s*${source}$`), '') : decodedTitle

    items.push({
      id: link,
      title,
      summary: '',
      sentiment: 'NEUTRAL',
      source: source ? decodeEntities(source) : 'Google News',
      publishedAt: pubDate ? new Date(pubDate) : new Date(),
      symbols: [],
      url: link,
    })
  }
  return items
}

export async function fetchMarketNews(symbols: string[] = [], limit = 20): Promise<NewsItem[]> {
  const queries = symbols.length > 0
    ? symbols.slice(0, 5).map(s => ({ query: `${s} share price NSE`, symbol: s }))
    : [{ query: 'NSE Sensex Nifty stock market', symbol: undefined }]

  const results = await Promise.allSettled(
    queries.map(({ query, symbol }) =>
      fetchGoogleNewsRss(query).then(items =>
        symbol ? items.map(item => ({ ...item, symbols: [symbol] })) : items
      )
    )
  )

  const seen = new Set<string>()
  const merged: NewsItem[] = []
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const item of r.value) {
      if (seen.has(item.url)) continue
      seen.add(item.url)
      merged.push(item)
    }
  }

  merged.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
  return merged.slice(0, limit)
}
