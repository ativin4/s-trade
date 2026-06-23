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

  const prompt = `You are a SEBI-registered research analyst. Generate actionable trade ideas for NSE-listed stocks.

STOCKS TO ANALYSE: ${symbols.join(', ')}

MARKET DATA:
${symbols.map(s => {
  const d = ltp[s]
  const price = d ? `CMP ₹${d.price} (${d.changePercent >= 0 ? '+' : ''}${d.changePercent}% today)` : 'CMP unknown'
  const snip  = news[s]?.slice(0, 2).map(n => `• ${n.title}`).join('\n') || 'No recent news'
  return `${s}: ${price}\nNews: ${snip}`
}).join('\n\n')}

INVESTOR PROFILE:
- Risk tolerance: ${userSettings?.riskTolerance ?? 'MODERATE'}
- Max trade size: ₹${(userSettings?.maxBudgetPerTrade ?? 50000).toLocaleString('en-IN')}

Return ONLY a JSON object with key "ideas" containing an array. Each idea:
{
  "symbol": "INFY",
  "recommendation": "BUY",           // BUY | SELL | HOLD | STRONG_BUY | STRONG_SELL
  "horizon": "SWING",                 // INTRADAY | SWING | POSITIONAL | LONG_TERM
  "entryMin": 1450,                   // entry range low
  "entryMax": 1480,                   // entry range high
  "target1": 1580,                    // first profit target
  "target2": 1650,                    // second target (optional, can be null)
  "stopLoss": 1400,                   // stop loss
  "upside": 8.5,                      // % upside to target1 from midpoint entry
  "riskReward": 2.6,                  // (target1-entry)/(entry-stopLoss)
  "confidence": 72,                   // 0-100
  "riskLevel": "MEDIUM",              // LOW | MEDIUM | HIGH | VERY_HIGH
  "timeframe": "2-4 weeks",
  "thesis": [                         // exactly 2-3 short bullets, no fluff
    "Breakout above 200-DMA on high volume",
    "Q4 results beat estimates by 8%; guidance raised",
    "RSI recovering from oversold; MACD crossover imminent"
  ],
  "reasoning": "one sentence summary",
  "keyFactors": ["factor1","factor2"],
  "targetPrice": 1580,
  "createdAt": "${new Date().toISOString()}"
}

All prices in INR. Be specific with numbers. thesis bullets must be concise (max 10 words each).`

  try {
    const chat = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    })

    const text = chat.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(text)
    const arr: AIAnalysisResponse[] = Array.isArray(parsed)
      ? parsed
      : (parsed.ideas ?? parsed.recommendations ?? parsed.stocks ?? parsed.data ?? Object.values(parsed)[0] ?? [])

    return (Array.isArray(arr) ? arr : []).map(item => ({
      ...item,
      confidence: typeof item.confidence === 'number'
        ? (item.confidence <= 1 ? item.confidence * 100 : item.confidence)
        : 50,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    }))
  } catch (err) {
    console.error('Groq insights error:', err)
    return []
  }
}
