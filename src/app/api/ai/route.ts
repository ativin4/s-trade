import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { GeminiAIService } from '@/lib/services/gemini'
import { AuthenticationError, ExternalAPIError } from '@/app/types'
import type { 
  APIResponse, 
  AIAnalysisRequest, 
  AIAnalysisResponse, 
} from '@/app/types'
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