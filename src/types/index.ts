export type BrokerAccount = { id: string; brokerName: string; };
export type BrokerName = string;
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
export type AIRecommendation = "BUY" | "SELL" | "HOLD" | "STRONG_BUY" | "STRONG_SELL";

export type MarketData = {
  nifty50: { value: number; changePercent: number };
  sensex: { value: number; changePercent: number };
  bankNifty: { value: number; changePercent: number };
  itIndex: { value: number; changePercent: number };
};

export type HistoricalData = {
  close: number;
  [key: string]: any; // Allow other properties
};

export type NewsData = {
  title: string;
  sentiment: string;
  source: string;
  [key: string]: any; // Allow other properties
};

export type TechnicalIndicators = {
  sma20: number;
  sma50: number;
  ema20: number;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
  };
  bollinger: {
    upper: number;
    lower: number;
  };
  volume: {
    ratio: number;
  };
};

export type UserSettings = {
  riskTolerance: string;
  maxBudgetPerTrade: number;
  excludedSectors?: string[];
  preferredMarketCap: string;
};

export type AIAnalysisRequest = {
  symbol: string;
  currentPrice: number;
  historicalData: HistoricalData[];
  newsData: NewsData[];
  technicalIndicators: TechnicalIndicators;
  userSettings: UserSettings;
};

export type AIAnalysisResponse = {
  symbol: string;
  recommendation: AIRecommendation;
  confidence: number;
  reasoning: string;
  targetPrice?: number | undefined;
  stopLoss?: number | undefined;
  timeframe: string;
  riskLevel: RiskLevel;
  keyFactors: string[];
  createdAt: Date;
};

export class ExternalAPIError extends Error {
  constructor(message: string, public statusCode?: number, public details?: any) {
    super(message);
    this.name = 'ExternalAPIError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export type APIResponse<T> = {
  success: true;
  data: T;
  message: string;
  timestamp: Date;
} | {
  success: false;
  error: string;
  message: string;
  timestamp: Date;
  data?: any;
};
