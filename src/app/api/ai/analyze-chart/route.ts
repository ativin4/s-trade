import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { symbol, candles, interval } = await req.json()
    if (!symbol || !candles || !candles.length) {
      return NextResponse.json({ error: 'Missing symbol or candles data' }, { status: 400 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    // Extract recent candles for analysis (last 20 to keep it concise)
    const recentCandles = candles.slice(-20)
    const currentPrice = recentCandles[recentCandles.length - 1].close

    const prompt = `You are an expert technical analyst. Latest ${interval}m candlestick data for "${symbol}". Current price ₹${currentPrice}.
Analyze recent price action, trend, and key levels from these candles (O/H/L/C/Vol):
${recentCandles.map((c: any) => `${c.open.toFixed(2)}/${c.high.toFixed(2)}/${c.low.toFixed(2)}/${c.close.toFixed(2)}/${c.volume}`).join(' | ')}

Give a 2-3 sentence technical insight: trend direction, key support/resistance, and short-term bias. Plain text only, no markdown.`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 150,
    })

    const insight = completion.choices[0]?.message?.content || 'Unable to generate analysis at this time.'

    return NextResponse.json({ insight })
  } catch (error) {
    console.error('Groq analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze chart' }, { status: 500 })
  }
}
