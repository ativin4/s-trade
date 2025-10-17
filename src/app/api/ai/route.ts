import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { GeminiAIService } from '@/lib/services/gemini'
import { prisma } from '@/lib/prisma'
import { AuthenticationError, ExternalAPIError } from '@/types'
import type { 
  APIResponse, 
  AIAnalysisRequest, 
  AIAnalysisResponse, 
} from '@/types'

// Request validation schema
const analyzeRequestSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  currentPrice: z.number().positive('Price must be positive'),
  historicalData: z.array(z.object({
    timestamp: z.string().datetime(),
    open: z.number(),
    high: z.number(),
    low: z.number(),
    close: z.number(),
    volume: z.number()
  })).min(1, 'Historical data is required'),
  newsData: z.array(z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    sentiment: z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL']),
    source: z.string(),
    publishedAt: z.string().datetime(),
    symbols: z.array(z.string()),
    url: z.string().url()
  })).optional(),
  technicalIndicators: z.object({
    sma20: z.number(),
    sma50: z.number(),
    ema20: z.number(),
    rsi: z.number(),
    macd: z.object({
      macd: z.number(),
      signal: z.number(),
      histogram: z.number()
    }),
    bollinger: z.object({
      upper: z.number(),
      middle: z.number(),
      lower: z.number()
    }),
    volume: z.object({
      avg: z.number(),
      current: z.number(),
      ratio: z.number()
    })
  }).optional(),
  includeUserPreferences: z.boolean().default(true)
})

type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse<AIAnalysisResponse>>> {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AuthenticationError('Please sign in to access AI analysis')
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = analyzeRequestSchema.parse(body)

    // Get user settings if requested
    let userSettings = null
    if (validatedData.includeUserPreferences) {
      userSettings = await prisma.userSettings.findUnique({
        where: { userId: session.user.id }
      })
    }

    // Prepare AI analysis request
    const aiRequest: AIAnalysisRequest = {
      symbol: validatedData.symbol,
      currentPrice: validatedData.currentPrice,
      historicalData: validatedData.historicalData.map(point => ({
        ...point,
        timestamp: new Date(point.timestamp)
      })),
      newsData: (validatedData.newsData ?? []).map(news => ({
        ...news,
        publishedAt: new Date(news.publishedAt)
      })),
      technicalIndicators: validatedData.technicalIndicators ?? {
        sma20: 0,
        sma50: 0,
        ema20: 0,
        rsi: 0,
        macd: { macd: 0, signal: 0, histogram: 0 },
        bollinger: { upper: 0, middle: 0, lower: 0 },
        volume: { avg: 0, current: 0, ratio: 0 }
      },
      userSettings: userSettings || undefined
    }

    // Initialize Gemini AI service
    const geminiService = new GeminiAIService()

    // Perform AI analysis
    const analysis = await geminiService.analyzeStock(aiRequest)

    // Save analysis to database for caching and history
    await prisma.aIAnalysis.create({
      data: {
        userId: session.user.id,
        symbol: analysis.symbol,
        recommendation: analysis.recommendation,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        targetPrice: analysis.targetPrice,
        stopLoss: analysis.stopLoss,
        timeframe: analysis.timeframe,
        riskLevel: analysis.riskLevel,
        keyFactors: analysis.keyFactors,
        requestData: aiRequest,
        responseData: analysis
      }
    })

    // Return successful response
    return NextResponse.json({
      success: true,
      data: analysis,
      message: 'Stock analysis completed successfully',
      timestamp: new Date()
    }, { status: 200 })

  } catch (error) {
    console.error('AI analysis error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        data: {
          issues: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        },
        timestamp: new Date()
      }, { status: 400 })
    }

    // Handle authentication errors
    if (error instanceof AuthenticationError) {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_ERROR',
        message: error.message,
        timestamp: new Date()
      }, { status: 401 })
    }

    // Handle external API errors
    if (error instanceof ExternalAPIError) {
      return NextResponse.json({
        success: false,
        error: 'AI_SERVICE_ERROR',
        message: 'Failed to analyze stock with AI service',
        timestamp: new Date()
      }, { status: 502 })
    }

    // Handle unexpected errors
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date()
    }, { status: 500 })
  }
}

// Bulk analysis endpoint
const bulkAnalyzeSchema = z.object({
  symbols: z.array(z.string()).min(1).max(20, 'Maximum 20 symbols allowed'),
  includeUserPreferences: z.boolean().default(true)
})

export async function PUT(request: NextRequest): Promise<NextResponse<APIResponse<AIAnalysisResponse[]>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const body = await request.json()
    const { symbols, includeUserPreferences } = bulkAnalyzeSchema.parse(body)

    // Get user settings
    let userSettings = null
    if (includeUserPreferences) {
      userSettings = await prisma.userSettings.findUnique({
        where: { userId: session.user.id }
      })
    }

    const geminiService = new GeminiAIService()
    const analyses: AIAnalysisResponse[] = []

    // Process symbols in batches to avoid rate limits
    const batchSize = 5
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (symbol) => {
        try {
          // Get basic stock data for analysis
          const stockData = await getStockData(symbol)
          const analysis = await geminiService.analyzeStock({
            symbol,
            currentPrice: stockData.currentPrice,
            historicalData: stockData.historicalData,
            newsData: stockData.newsData,
            technicalIndicators: stockData.technicalIndicators,
            userSettings: userSettings || undefined
          })
          
          return analysis
        } catch (error) {
          console.error(`Error analyzing ${symbol}:`, error)
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      analyses.push(...batchResults.filter(Boolean) as AIAnalysisResponse[])
    }

    return NextResponse.json({
      success: true,
      data: analyses,
      message: `Analyzed ${analyses.length} stocks successfully`,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Bulk analysis error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        timestamp: new Date()
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to perform bulk analysis',
      timestamp: new Date()
    }, { status: 500 })
  }
}

// Helper function to get stock data
async function getStockData(symbol: string) {
  // This would integrate with actual stock data providers
  // For now, return mock data structure
  return {
    currentPrice: 100,
    historicalData: [
      {
        timestamp: new Date(),
        open: 99,
        high: 101,
        low: 98,
        close: 100,
        volume: 1000000
      }
    ],
    newsData: [],
    technicalIndicators: {
      sma20: 100,
      sma50: 105,
      ema20: 99,
      rsi: 45,
      macd: {
        macd: 0.5,
        signal: 0.3,
        histogram: 0.2
      },
      bollinger: {
        upper: 105,
        middle: 100,
        lower: 95
      },
      volume: {
        avg: 900000,
        current: 1000000,
        ratio: 1.11
      }
    }
  }
}