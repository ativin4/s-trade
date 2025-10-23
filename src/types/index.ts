import { type ClientSafeProvider } from "next-auth/react";



export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ExternalAPIError extends Error {
  constructor(message: string, public service: string) {
    super(message);
    this.name = 'ExternalAPIError';
  }
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  timestamp: Date;
}

export interface AIAnalysisRequest {
  symbol: string;
  currentPrice: number;
  historicalData: any[];
  newsData?: any[];
  technicalIndicators?: any;
  userSettings?: any;
}

export interface AIAnalysisResponse {
  symbol: string;
  recommendation: string;
  confidence: number;
  reasoning: string;
  targetPrice?: number;
  stopLoss?: number;
  timeframe?: string;
  riskLevel?: string;
  keyFactors?: any;
}

export type BrokerName = '5paisa' | 'zerodha' | 'groww';

export interface BrokerAccount {
  id: string;
  userId: string;
  brokerName: BrokerName;
  accountId: string;
  apiKey: string;
  apiSecret: string | null;
  accessToken: string | null;
  isActive: boolean;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
    id: string;
    userId: string;
    maxBudgetPerTrade: number | null;
    riskTolerance: string | null;
    autoTradingEnabled: boolean | null;
    excludedSectors: string[];
    preferredMarketCap: string | null;
    otpMethod: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Trade {
    id: string;
    symbol: string;
    quantity: number;
    price: number;
    type: 'BUY' | 'SELL';
    status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
    createdAt: Date;
}