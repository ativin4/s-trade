import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { ExternalAPIError } from '@/types'
import type { 
  AIAnalysisRequest, 
  AIAnalysisResponse, 
  MarketData, 
  AIRecommendation,
  RiskLevel
} from '@/types'

interface GeminiResponse {
  recommendation: AIRecommendation
  confidence: number
  reasoning: string
  targetPrice?: number
  stopLoss?: number
  timeframe: string
  riskLevel: RiskLevel
  keyFactors: string[]
}

export class GeminiAIService {
  private genAI: GoogleGenerativeAI
  private model: GenerativeModel

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }

    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent financial analysis
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    })
  }

  async analyzeStock(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      const prompt = this.buildAnalysisPrompt(request)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse the AI response
      const analysis = this.parseAIResponse(text, request.symbol)

      return {
        symbol: request.symbol,
        recommendation: analysis.recommendation,
        confidence: Math.min(Math.max(analysis.confidence, 0), 100), // Ensure 0-100 range
        reasoning: analysis.reasoning,
        targetPrice: analysis.targetPrice,
        stopLoss: analysis.stopLoss,
        timeframe: analysis.timeframe || '2-4 weeks',
        riskLevel: analysis.riskLevel,
        keyFactors: analysis.keyFactors || [],
        createdAt: new Date()
      }
    } catch (error) {
      console.error(`Gemini AI analysis error for ${request.symbol}:`, error)
      throw new ExternalAPIError(
        `Failed to analyze ${request.symbol} using AI`,
        undefined,
        { symbol: request.symbol, error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  async getMarketSentiment(marketData: MarketData): Promise<{
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
    confidence: number
    factors: string[]
    reasoning: string
  }> {
    try {
      const prompt = this.buildMarketSentimentPrompt(marketData)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return this.parseMarketSentimentResponse(text)
    } catch (error) {
      console.error('Market sentiment analysis error:', error)
      return {
        sentiment: 'NEUTRAL',
        confidence: 50,
        factors: ['Unable to analyze market sentiment'],
        reasoning: 'AI analysis temporarily unavailable'
      }
    }
  }

  async generateTradingPlan(
    holdings: Array<{ symbol: string; quantity: number; avgPrice: number; currentPrice: number }>,
    budget: number,
    riskTolerance: string
  ): Promise<{
    suggestions: Array<{
      action: 'BUY' | 'SELL' | 'HOLD'
      symbol: string
      quantity?: number
      reasoning: string
      priority: number
    }>
    overallStrategy: string
    riskAssessment: string
  }> {
    try {
      const prompt = this.buildTradingPlanPrompt(holdings, budget, riskTolerance)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return this.parseTradingPlanResponse(text)
    } catch (error) {
      console.error('Trading plan generation error:', error)
      throw new ExternalAPIError('Failed to generate trading plan')
    }
  }

  private buildAnalysisPrompt(request: AIAnalysisRequest): string {
    const { symbol, currentPrice, historicalData, newsData, technicalIndicators, userSettings } = request

    // Get recent price data for context
    const recentData = historicalData.slice(-30) // Last 30 data points
    const priceChange = recentData.length > 1 && recentData[0] && typeof recentData[0].close === 'number'
      ? ((currentPrice - recentData[0].close) / recentData[0].close) * 100 
      : 0

    let prompt = `
    As an expert financial analyst specializing in Indian stock markets, analyze ${symbol} for swing trading opportunities (1-4 week holding period).

    CURRENT DATA:
    - Symbol: ${symbol}
    - Current Price: ₹${currentPrice}
    - Recent Performance: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}% over ${recentData.length} periods
    
    TECHNICAL ANALYSIS:`

    if (technicalIndicators) {
      prompt += `
    - SMA 20: ₹${technicalIndicators.sma20} | SMA 50: ₹${technicalIndicators.sma50}
    - EMA 20: ₹${technicalIndicators.ema20}
    - RSI: ${technicalIndicators.rsi}
    - MACD: ${technicalIndicators.macd.macd} (Signal: ${technicalIndicators.macd.signal})
    - Bollinger Bands: Upper ₹${technicalIndicators.bollinger.upper}, Lower ₹${technicalIndicators.bollinger.lower}
    - Volume Ratio: ${technicalIndicators.volume.ratio}x average`
    }

    if (newsData && newsData.length > 0) {
      prompt += `
    
    RECENT NEWS SENTIMENT:
    ${newsData.slice(0, 5).map(news => 
      `- ${news.title} (${news.sentiment}) - ${news.source}`
    ).join('\n')}`
    }

    if (userSettings) {
      prompt += `
    
    USER PREFERENCES:
    - Risk Tolerance: ${userSettings.riskTolerance}
    - Max Budget Per Trade: ₹${userSettings.maxBudgetPerTrade}
    - Excluded Sectors: ${userSettings.excludedSectors?.join(', ') || 'None'}
    - Preferred Market Cap: ${userSettings.preferredMarketCap}`
    }

    prompt += `

    Provide your analysis in this EXACT JSON format (no additional text):
    {
      "recommendation": "BUY|SELL|HOLD|STRONG_BUY|STRONG_SELL",
      "confidence": 85,
      "reasoning": "Detailed analysis with specific technical and fundamental reasons",
      "targetPrice": 1250.50,
      "stopLoss": 1180.00,
      "timeframe": "2-4 weeks",
      "riskLevel": "LOW|MEDIUM|HIGH|VERY_HIGH",
      "keyFactors": ["Factor 1", "Factor 2", "Factor 3"]
    }

    Focus on:
    1. Technical patterns and momentum
    2. Volume analysis and breakout potential
    3. Risk-reward ratio for swing trading
    4. Market sector performance
    5. Indian market specific factors (SEBI regulations, FII/DII activity, etc.)
    
    Be specific with price targets and risk management.`

    return prompt
  }

  private buildMarketSentimentPrompt(marketData: MarketData): string {
    return `
    Analyze current Indian stock market sentiment based on these indices:

    NIFTY 50: ${marketData.nifty50.value} (${marketData.nifty50.changePercent > 0 ? '+' : ''}${marketData.nifty50.changePercent}%)
    SENSEX: ${marketData.sensex.value} (${marketData.sensex.changePercent > 0 ? '+' : ''}${marketData.sensex.changePercent}%)
    BANK NIFTY: ${marketData.bankNifty.value} (${marketData.bankNifty.changePercent > 0 ? '+' : ''}${marketData.bankNifty.changePercent}%)
    IT INDEX: ${marketData.itIndex.value} (${marketData.itIndex.changePercent > 0 ? '+' : ''}${marketData.itIndex.changePercent}%)

    Provide analysis in this EXACT JSON format:
    {
      "sentiment": "BULLISH|BEARISH|NEUTRAL",
      "confidence": 75,
      "factors": ["Factor 1", "Factor 2", "Factor 3"],
      "reasoning": "Detailed explanation of market conditions and outlook"
    }

    Consider global markets, FII/DII flows, sector rotation, and technical levels.`
  }

  private buildTradingPlanPrompt(
    holdings: Array<{ symbol: string; quantity: number; avgPrice: number; currentPrice: number }>,
    budget: number,
    riskTolerance: string
  ): string {
    const portfolioValue = holdings.reduce((sum, holding) => 
      sum + (holding.quantity * holding.currentPrice), 0)

    const holdingsText = holdings.map(h => 
      `${h.symbol}: ${h.quantity} shares @ ₹${h.avgPrice} (Current: ₹${h.currentPrice})`
    ).join('\n')

    return `
    Create a comprehensive trading plan for this Indian stock portfolio:

    CURRENT HOLDINGS:
    ${holdingsText}
    
    Portfolio Value: ₹${portfolioValue.toLocaleString('en-IN')}
    Available Budget: ₹${budget.toLocaleString('en-IN')}
    Risk Tolerance: ${riskTolerance}

    Provide recommendations in this EXACT JSON format:
    {
      "suggestions": [
        {
          "action": "BUY|SELL|HOLD",
          "symbol": "RELIANCE.NS",
          "quantity": 10,
          "reasoning": "Specific reason for this recommendation",
          "priority": 9
        }
      ],
      "overallStrategy": "Portfolio strategy and diversification advice",
      "riskAssessment": "Risk analysis and mitigation suggestions"
    }

    Focus on portfolio optimization, risk management, and sector diversification for Indian markets.`
  }

  private parseAIResponse(text: string, symbol: string): GeminiResponse {
    try {
      // Clean the response text
      let cleanText = text.trim()
      
      // Extract JSON from response if it's wrapped in other text
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanText = jsonMatch[0]
      }

      const parsed = JSON.parse(cleanText) as GeminiResponse

      // Validate required fields
      if (!parsed.recommendation || !parsed.reasoning) {
        throw new Error('Missing required fields in AI response')
      }

      // Ensure confidence is within valid range
      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 100) {
        parsed.confidence = 50 // Default to moderate confidence
      }

      return parsed
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      
      // Return fallback response
      return {
        recommendation: 'HOLD',
        confidence: 50,
        reasoning: `Unable to parse AI analysis for ${symbol}. Manual analysis recommended.`,
        timeframe: '2-4 weeks',
        riskLevel: 'MEDIUM',
        keyFactors: ['AI parsing error', 'Manual review needed']
      }
    }
  }

  private parseMarketSentimentResponse(text: string): {
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
    confidence: number
    factors: string[]
    reasoning: string
  } {
    try {
      const cleanText = text.trim()
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          sentiment: parsed.sentiment || 'NEUTRAL',
          confidence: Math.min(Math.max(parsed.confidence || 50, 0), 100),
          factors: Array.isArray(parsed.factors) ? parsed.factors : [],
          reasoning: parsed.reasoning || 'Analysis completed'
        }
      }
    } catch (error) {
      console.error('Failed to parse market sentiment:', error)
    }

    return {
      sentiment: 'NEUTRAL',
      confidence: 50,
      factors: ['Unable to analyze sentiment'],
      reasoning: 'AI response parsing failed'
    }
  }

  private parseTradingPlanResponse(text: string): {
    suggestions: Array<{
      action: 'BUY' | 'SELL' | 'HOLD'
      symbol: string
      quantity?: number
      reasoning: string
      priority: number
    }>
    overallStrategy: string
    riskAssessment: string
  } {
    try {
      const cleanText = text.trim()
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
          overallStrategy: parsed.overallStrategy || 'No specific strategy provided',
          riskAssessment: parsed.riskAssessment || 'Risk assessment unavailable'
        }
      }
    } catch (error) {
      console.error('Failed to parse trading plan:', error)
    }

    return {
      suggestions: [],
      overallStrategy: 'Unable to generate trading plan',
      riskAssessment: 'Manual risk assessment required'
    }
  }

  async summarizeNews(news: Array<{ title: string; url: string; source: string; sentiment: string }>): Promise<{
    summary: string
    keyPoints: string[]
    mentionedStocks: string[]
  }> {
    try {
      const prompt = this.buildNewsSummaryPrompt(news)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return this.parseNewsSummaryResponse(text)
    } catch (error) {
      console.error('News summarization error:', error)
      throw new ExternalAPIError('Failed to summarize news')
    }
  }

  private buildNewsSummaryPrompt(news: Array<{ title: string; url: string; source: string; sentiment: string }>): string {
    const newsText = news.map(n => `- ${n.title} (${n.source}, Sentiment: ${n.sentiment})`).join('\n')

    return `
    As a financial analyst, summarize the key insights from these Indian market news headlines.
    Focus on market-moving information, sector trends, and specific company news.

    NEWS HEADLINES:
    ${newsText}

    Provide your summary in this EXACT JSON format:
    {
      "summary": "A concise overview of the most important news.",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "mentionedStocks": ["STOCK1.NS", "STOCK2.NS"]
    }
    `
  }

  private parseNewsSummaryResponse(text: string): {
    summary: string
    keyPoints: string[]
    mentionedStocks: string[]
  } {
    try {
      const cleanText = text.trim()
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          summary: parsed.summary || 'No summary available.',
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          mentionedStocks: Array.isArray(parsed.mentionedStocks) ? parsed.mentionedStocks : []
        }
      }
    } catch (error) {
      console.error('Failed to parse news summary:', error)
    }

    return {
      summary: 'Unable to generate news summary.',
      keyPoints: [],
      mentionedStocks: []
    }
  }
}