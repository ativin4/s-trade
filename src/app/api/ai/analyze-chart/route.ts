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

    const prompt = `You are an expert technical analyst. I will provide you with the latest ${interval}m candlestick data for the stock/instrument "${symbol}". 
    The current price is ₹${currentPrice}. 
    Analyze the recent price action, trend, and volatility based on the following recent candles (O=Open, H=High, L=Low, C=Close, V=Volume):
    ${recentCandles.map((c: any) => `C: ${c.close.toFixed(2)}, O: ${c.open.toFixed(2)}, H: ${c.high.toFixed(2)}, L: ${c.low.toFixed(2)}, Vol: ${c.volume}`).join('\n')}

    Provide a concise, 2-3 sentence technical insight on the current performance and potential short-term movement. Do not use markdown formatting like bolding or lists, just return plain text. Keep it professional and direct.`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.5,
      max_tokens: 150,
    })

    const insight = completion.choices[0]?.message?.content || 'Unable to generate analysis at this time.'

    return NextResponse.json({ insight })
  } catch (error) {
    console.error('Groq analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze chart' }, { status: 500 })
  }
}
