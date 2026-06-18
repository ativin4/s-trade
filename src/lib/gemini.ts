import Groq from 'groq-sdk'
import type { AIAnalysisResponse, UserSettings, NewsItem, TechnicalIndicators } from '@/app/types'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = 'llama-3.3-70b-versatile'

export interface AdditionalData {
  news?: Record<string, NewsItem[]>
  ltp?: Record<string, { price: number; change: number; changePercent: number }>
  technicals?: Record<string, TechnicalIndicators>
}

export async function getGeminiInsights(
  symbols: string[],
  userSettings: UserSettings | null,
  additionalData?: AdditionalData
): Promise<AIAnalysisResponse[]> {
  const { news = {}, ltp = {}, technicals = {} } = additionalData || {}

  const prompt = `You are an expert stock market analyst. Provide trading recommendations for: ${symbols.join(', ')}.

CONTEXT DATA:
${symbols.map(s => {
  const price = ltp[s]?.price ? `₹${ltp[s].price} (${ltp[s].changePercent}%)` : 'Unknown price'
  const techData = technicals[s]
  const tech = techData ? `\nTechnicals: RSI ${techData.rsi}, SMA20 ₹${techData.sma20}, SMA50 ₹${techData.sma50}` : ''
  const snip = news[s]?.slice(0, 3).map(n => `- ${n.title} (${n.source})`).join('\n') || 'No recent news'
  return `--- ${s} ---
Price: ${price}${tech}
News:
${snip}`
}).join('\n\n')}

User preferences:
- Risk Tolerance: ${userSettings?.riskTolerance ?? 'MODERATE'}
- Max Budget Per Trade: ${userSettings?.maxBudgetPerTrade ?? 50000}
- Excluded Sectors: ${userSettings?.excludedSectors?.join(', ') ?? 'none'}
- Preferred Market Cap: ${userSettings?.preferredMarketCap ?? 'any'}

Return ONLY a JSON array, no markdown, no extra text. Each object must have:
symbol, recommendation (BUY|SELL|HOLD|STRONG_BUY|STRONG_SELL), confidence (0-1), reasoning (string), targetPrice (number), stopLoss (number), timeframe (e.g. "3-6 Months"), riskLevel (LOW|MEDIUM|HIGH|VERY_HIGH), keyFactors (string[]), createdAt (ISO date)`

  try {
    const chat = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    })

    const text = chat.choices[0]?.message?.content ?? '[]'
    // Groq json_object wraps array in an object — unwrap
    const parsed = JSON.parse(text)
    const arr: AIAnalysisResponse[] = Array.isArray(parsed)
      ? parsed
      : (parsed.recommendations ?? parsed.stocks ?? parsed.data ?? Object.values(parsed)[0] ?? [])
    
    return (Array.isArray(arr) ? arr : []).map(item => ({
      ...item,
      confidence: typeof item.confidence === 'number' 
        ? (item.confidence <= 1 ? item.confidence * 100 : item.confidence) 
        : 50,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
    }))
  } catch (err) {
    console.error('Groq insights error:', err)
    return []
  }
}
