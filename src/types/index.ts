import type { Adapter } from "next-auth/adapters";
import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt";
import type { Provider } from "next-auth/providers/index";

// Global types for the S-Trade application

export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface BrokerAccount {
  id: string
  userId: string
  brokerName: BrokerName
  accountId: string
  apiKey: string
  apiSecret: string | null
  accessToken: string | null
  isActive: boolean
  balance: number
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  symbol: string
  type: OrderType
  side: TradeType
  quantity: number
  price: number
  status: 'OPEN' | 'CANCELLED' | 'FILLED' | 'PARTIAL'
  createdAt: Date
}
export interface Trade {
  id: string
  userId: string
  brokerAccountId: string
  symbol: string
  quantity: number
  price: number
  tradeType: TradeType
  orderType: OrderType
  status: TradeStatus
  aiConfidence: number | null
  aiReason: string | null
  executedAt: Date | null
  createdAt: Date
}

export interface UserSettings {
  id: string
  userId: string
  maxBudgetPerTrade: number
  riskTolerance: RiskTolerance
  autoTradingEnabled: boolean
  excludedSectors: string[]
  preferredMarketCap: MarketCap
  otpMethod: OTPMethod
  createdAt: Date
  updatedAt: Date
}

export interface StockData {
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  sector: string
  industry: string
  pe: number | null
  eps: number | null
  high52Week: number
  low52Week: number
  avgVolume: number
  beta: number | null
}

export interface PortfolioHolding {
  symbol: string
  name: string
  quantity: number
  avgPrice: number
  currentPrice: number
  change: number
  changePercent: number
  marketValue: number
  gainLoss: number
  gainLossPercent: number
  aiRecommendation: AIRecommendation
  confidence: number
  insight: string
  brokerAccountId: string
}

export interface AIAnalysisRequest {
  symbol: string
  currentPrice: number
  historicalData: PricePoint[]
  newsData?: NewsItem[]
  technicalIndicators?: TechnicalIndicators
  userSettings?: Partial<UserSettings>
}

export interface AIAnalysisResponse {
  symbol: string
  recommendation: AIRecommendation
  confidence: number
  reasoning: string
  targetPrice?: number
  stopLoss?: number
  timeframe: string
  riskLevel: RiskLevel
  keyFactors: string[]
  createdAt: Date
}

export interface PricePoint {
  timestamp: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  sentiment: NewsSentiment
  source: string
  publishedAt: Date
  symbols: string[]
  url: string
}

export interface TechnicalIndicators {
  sma20: number
  sma50: number
  ema20: number
  rsi: number
  macd: {
    macd: number
    signal: number
    histogram: number
  }
  bollinger: {
    upper: number
    middle: number
    lower: number
  }
  volume: {
    avg: number
    current: number
    ratio: number
  }
}

export interface MarketData {
  nifty50: MarketIndex
  sensex: MarketIndex
  bankNifty: MarketIndex
  itIndex: MarketIndex
}
export interface MarketSentiment {
  factors: string[]
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  reasoning: string
}
export interface MarketIndex {
  value: number
  change: number
  changePercent: number
  high: number
  low: number
  volume: number
}

export interface OrderRequest {
  symbol: string
  quantity: number
  price: number
  tradeType: TradeType
  orderType: OrderType
  brokerAccountId: string
  stopLoss?: number
  target?: number
  validity: OrderValidity
}

export interface OrderResponse {
  orderId: string
  status: OrderStatus
  message: string
  timestamp: Date
}

export interface OTPRequest {
  brokerName: BrokerName
  orderId: string
  message: string
}

export interface OTPResponse {
  otp: string | null
  extractedFrom: OTPSource
  confidence: number
}

export type APIResponse<T = unknown> = | {
    success: true
    data: T
    message?: string
    timestamp: Date
  }
  | {
    success: false
    data?: any
    error: string
    message?: string
    timestamp: Date
  }

export interface PaginatedResponse<T = unknown> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface WebSocketMessage {
  type: WSMessageType
  symbol?: string
  data: Record<string, unknown>
  timestamp: Date
}

// Enums
export type BrokerName = '5paisa' | 'zerodha' | 'groww'

export type TradeType = 'BUY' | 'SELL'

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LIMIT'

export type TradeStatus = 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'FAILED' | 'PARTIAL'

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'EXECUTED' | 'REJECTED' | 'CANCELLED'

export type OrderValidity = 'DAY' | 'IOC' | 'GTC' | 'GTD'

export type RiskTolerance = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE'

export type MarketCap = 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' | 'MULTI_CAP'

export type OTPMethod = 'EMAIL' | 'SMS' | 'IMESSAGE' | 'TOTP'

export type AIRecommendation = 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'

export type NewsSentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'

export type OTPSource = 'EMAIL' | 'SMS' | 'MANUAL'

export type WSMessageType = 'PRICE_UPDATE' | 'ORDER_UPDATE' | 'PORTFOLIO_UPDATE' | 'NEWS_UPDATE'

// Form Types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface BrokerConnectionFormData {
  brokerName: BrokerName
  apiKey: string
  apiSecret: string
  accountId?: string
}

export interface TradingPreferencesFormData {
  maxBudgetPerTrade: number
  riskTolerance: RiskTolerance
  excludedSectors: string[]
  preferredMarketCap: MarketCap
  autoTradingEnabled: boolean
}

export interface TradingPlan {
  summary: string
}

export interface TradeFormData {
  symbol: string
  quantity: number
  price: number
  tradeType: TradeType
  orderType: OrderType
  stopLoss?: number
  target?: number
  validity: OrderValidity
}

// Component Props Types
export interface DashboardProps {
  user: User
  portfolio: PortfolioHolding[]
  brokerAccounts: BrokerAccount[]
  aiInsights: AIAnalysisResponse[]
}

export interface PortfolioCardProps {
  holding: PortfolioHolding
  onTrade: (symbol: string, action: TradeType) => void
}

export interface StockChartProps {
  symbol: string
  data: PricePoint[]
  indicators?: TechnicalIndicators
  height?: number
}

export interface AIInsightCardProps {
  analysis: AIAnalysisResponse
  onAccept?: () => void
  onReject?: () => void
}

export interface BrokerStatusCardProps {
  broker: BrokerAccount
  onConnect: () => void
  onDisconnect: () => void
}

// API Route Types
export interface AuthSession {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  expires: string
}

export interface NextAuthOptions {
  providers: Provider[]
  adapter: Adapter
  session: {
    strategy: 'jwt'
  }
  callbacks: {
    session: (params: { session: Session; token: JWT }) => Promise<Session>
    jwt: (params: { user: User; token: JWT }) => Promise<JWT>
  }
}

// Store Types (Zustand)
export interface AppState {
  user: User | null
  portfolio: PortfolioHolding[]
  brokerAccounts: BrokerAccount[]
  marketData: MarketData | null
  aiInsights: AIAnalysisResponse[]
  selectedStock: string | null
  isLoading: boolean
  error: string | null
}

export interface AppActions {
  setUser: (user: User | null) => void
  setPortfolio: (portfolio: PortfolioHolding[]) => void
  setBrokerAccounts: (accounts: BrokerAccount[]) => void
  setMarketData: (data: MarketData) => void
  addAIInsight: (insight: AIAnalysisResponse) => void
  setSelectedStock: (symbol: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export type AppStore = AppState & AppActions

// Utility Types
export type NonNullable<T> = T extends null | undefined ? never : T

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type MakeRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Writeable<T> = { -readonly [P in keyof T]: T[P] }

// Error Types
export class AppError extends Error {
  constructor(
    public override message: string,
    public code: string,
    public statusCode: number = 500,
    public data?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, data?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, data)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404)
    this.name = 'NotFoundError'
  }
}

export class ExternalAPIError extends AppError {
  constructor(message: string, brokerName?: BrokerName, data?: Record<string, unknown>) {
    super(message, 'EXTERNAL_API_ERROR', 502, { brokerName, ...data })
    this.name = 'ExternalAPIError'
  }
}

// Constants
export const SECTORS = [
  'Technology',
  'Banking',
  'Pharmaceuticals',
  'Energy',
  'Consumer Goods',
  'Automotive',
  'Real Estate',
  'Telecom',
  'Metals',
  'Infrastructure',
  'Media',
  'Textiles',
  'Chemicals',
  'Agriculture'
] as const

export const INDIAN_EXCHANGES = [
  'NSE',
  'BSE'
] as const

export const MARKET_SESSIONS = {
  PRE_MARKET: { start: '09:00', end: '09:15' },
  REGULAR: { start: '09:15', end: '15:30' },
  POST_MARKET: { start: '15:40', end: '16:00' }
} as const

export type Sector = typeof SECTORS[number]
export type Exchange = typeof INDIAN_EXCHANGES[number]
