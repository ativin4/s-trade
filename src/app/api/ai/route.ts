import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { GeminiAIService } from '@/lib/services/gemini'
import { AuthenticationError, ExternalAPIError } from '@/types'
import type { 
  APIResponse, 
  AIAnalysisRequest, 
  AIAnalysisResponse, 
} from '@/types'
import { mapPrismaToAppSettings } from '@/lib/user'


export async function POST(request: NextRequest): Promise<NextResponse<APIResponse<AIAnalysisResponse>>> {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError('Please sign in to access AI analysis');
    }

    // Parse and validate request body
    const body = await request.json();
    // Manual validation and defaults
    const symbol = typeof body.symbol === 'string' && body.symbol.length > 0 ? body.symbol : '';
    const currentPrice = typeof body.currentPrice === 'number' && body.currentPrice > 0 ? body.currentPrice : 0;
    const historicalData = Array.isArray(body.historicalData)
      ? body.historicalData.map((point: {
          timestamp?: string;
          open?: number;
          high?: number;
          low?: number;
          close?: number;
          volume?: number;
        }) => ({
          ...point,
          timestamp: point.timestamp ? new Date(point.timestamp).toISOString() : new Date().toISOString(),
          open: typeof point.open === 'number' ? point.open : 0,
          high: typeof point.high === 'number' ? point.high : 0,
          low: typeof point.low === 'number' ? point.low : 0,
          close: typeof point.close === 'number' ? point.close : 0,
          volume: typeof point.volume === 'number' ? point.volume : 0,
        })
      )
      : [];
    const newsData = Array.isArray(body.newsData)
      ? body.newsData.map((news: {
          publishedAt?: string;
          sentiment?: string;
          symbols?: string[];
          url?: string;
          [key: string]: any;
        }) => ({
          ...news,
          publishedAt: news.publishedAt ? new Date(news.publishedAt).toISOString() : new Date().toISOString(),
          sentiment: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'].includes(news.sentiment || '') ? news.sentiment : 'NEUTRAL',
          symbols: Array.isArray(news.symbols) ? news.symbols : [],
          url: typeof news.url === 'string' ? news.url : '',
        })
      )
      : [];
    const technicalIndicators = typeof body.technicalIndicators === 'object' && body.technicalIndicators !== null ? body.technicalIndicators : undefined;
    const includeUserPreferences = typeof body.includeUserPreferences === 'boolean' ? body.includeUserPreferences : true;

    // Get user settings if requested
    let userSettings = null;
    if (includeUserPreferences) {
      const prismaSettings = await prisma.userSettings.findUnique({
        where: { userId: session.user.id }
      });
      userSettings = mapPrismaToAppSettings(prismaSettings);
    }

    // Prepare AI analysis request
    const aiRequest: AIAnalysisRequest = {
      symbol,
      currentPrice,
      historicalData,
      newsData,
      technicalIndicators,
      userSettings: userSettings || undefined
    };

    // Initialize Gemini AI service
    const geminiService = new GeminiAIService();

    // Perform AI analysis
    const analysis = await geminiService.analyzeStock(aiRequest);

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
    });

    // Return successful response
    return NextResponse.json({
      success: true,
      data: analysis,
      message: 'Stock analysis completed successfully',
      timestamp: new Date()
    }, { status: 200 });

  } catch (error) {
    console.error('AI analysis error:', error);

    // Handle authentication errors
    if (error instanceof AuthenticationError) {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_ERROR',
        message: error.message,
        timestamp: new Date()
      }, { status: 401 });
    }

    // Handle external API errors
    if (error instanceof ExternalAPIError) {
      return NextResponse.json({
        success: false,
        error: 'AI_SERVICE_ERROR',
        message: 'Failed to analyze stock with AI service',
        timestamp: new Date()
      }, { status: 502 });
    }

    // Handle unexpected errors
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date()
    }, { status: 500 });
  }
}

// Bulk analysis endpoint
type BulkAnalyzeRequest = {
  symbols: string[];
  includeUserPreferences?: boolean;
};

export async function PUT(request: NextRequest): Promise<NextResponse<APIResponse<AIAnalysisResponse[]>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const body: BulkAnalyzeRequest = await request.json();
    const symbols = Array.isArray(body.symbols) ? body.symbols.slice(0, 20) : [];
    const includeUserPreferences = body.includeUserPreferences ?? true;

    // Get user settings
    let userSettings = null;
    if (includeUserPreferences) {
      const prismaSettings = await prisma.userSettings.findUnique({
        where: { userId: session.user.id }
      });
      userSettings = mapPrismaToAppSettings(prismaSettings);
    }

    const geminiService = new GeminiAIService();
    const analyses: AIAnalysisResponse[] = [];

    // Process symbols in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchPromises = batch.map(async (symbol) => {
        try {
          // Get basic stock data for analysis
          const stockData = await getStockData(symbol);
          const analysis = await geminiService.analyzeStock({
            symbol,
            currentPrice: stockData.currentPrice,
            historicalData: stockData.historicalData,
            newsData: stockData.newsData,
            technicalIndicators: stockData.technicalIndicators,
            userSettings: userSettings || undefined
          });
          return analysis;
        } catch (error) {
          console.error(`Error analyzing ${symbol}:`, error);
          return null;
        }
      });
      const batchResults = await Promise.all(batchPromises);
      analyses.push(...batchResults.filter(Boolean) as AIAnalysisResponse[]);
    }

    return NextResponse.json({
      success: true,
      data: analyses,
      message: `Analyzed ${analyses.length} stocks successfully`,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Bulk analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to perform bulk analysis',
      timestamp: new Date()
    });
  }
}

import { getKiteMarketData } from '@/lib/market-data'

// Helper function to get stock data
async function getStockData(symbol: string) {
  const marketData = await getKiteMarketData();
  // This is a simplified implementation. In a real app, you would need to
  // fetch the specific stock data from the market data provider.
  const stockData = (marketData as any)[symbol];
  if (!stockData) {
    throw new Error(`Stock data not found for symbol: ${symbol}`);
  }
  return {
    currentPrice: stockData.value,
    historicalData: [
      {
        timestamp: new Date(),
        open: stockData.low,
        high: stockData.high,
        low: stockData.low,
        close: stockData.value,
        volume: stockData.volume
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