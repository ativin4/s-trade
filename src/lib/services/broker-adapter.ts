const BASE = process.env.BROKER_ADAPTER_URL
const KEY  = process.env.BROKER_ADAPTER_SECRET

function isConfigured() {
  return Boolean(BASE && KEY)
}

async function adapterFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isConfigured()) throw new Error('BROKER_ADAPTER_URL not configured')
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'x-api-key': KEY!, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Adapter ${res.status}: ${detail}`)
  }
  const body = await res.json()
  return body.data as T
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdapterHolding {
  symbol: string
  isin: string
  exchange: string
  qty: number
  avgPrice: number
  ltp: number
  closePrice: number
  pnl: number
  dayChange: number
  dayChangePct: number
  t1Qty: number
}

export interface AdapterPosition {
  symbol: string
  exchange: string
  product: string
  qty: number
  avgPrice: number
  ltp: number
  realisedPnl: number
  unrealisedPnl: number
  side: 'BUY' | 'SELL'
}

export interface AdapterLtpEntry {
  price: number
  change: number
  changePercent: number
}

export interface AdapterCandle {
  time: number   // unix ms
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface AdapterMargin {
  available: number
  used: number
  total: number
}

// ── API ───────────────────────────────────────────────────────────────────────

function q(params: Record<string, string | number | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  return entries.length ? '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&') : ''
}

export const brokerAdapter = {
  available: isConfigured,

  holdings: (broker?: string) =>
    adapterFetch<AdapterHolding[]>(`/holdings${q({ broker })}`),

  positions: (broker?: string) =>
    adapterFetch<AdapterPosition[]>(`/positions${q({ broker })}`),

  ltp: (symbols: string[], exchange = 'NSE', broker?: string) =>
    adapterFetch<Record<string, AdapterLtpEntry>>(
      `/ltp${q({ symbols: symbols.join(','), exchange, broker })}`
    ),

  candles: (symbol: string, interval = '5', days = 1, exchange = 'NSE', broker?: string) =>
    adapterFetch<AdapterCandle[]>(
      `/candles${q({ symbol, interval, days, exchange, broker })}`
    ),

  margin: (broker?: string) =>
    adapterFetch<AdapterMargin>(`/margin${q({ broker })}`),

  placeOrder: (order: {
    symbol: string
    qty: number
    side: 'BUY' | 'SELL'
    orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_MARKET'
    product: 'CNC' | 'MIS'
    price?: number
    triggerPrice?: number
    exchange?: string
    referenceId?: string
  }) =>
    adapterFetch<{ groww_order_id: string; order_status: string }>('/order', {
      method: 'POST',
      body: JSON.stringify(order),
    }),

  cancelOrder: (orderId: string) =>
    adapterFetch<{ groww_order_id: string }>(`/order/${orderId}`, { method: 'DELETE' }),

  orders: (page = 0, pageSize = 25) =>
    adapterFetch<{ order_list: any[] }>(`/orders?page=${page}&page_size=${pageSize}`),

  // Market data — yfinance fallback, no broker auth required
  marketLtp: (symbols: string[], exchange = 'NSE') =>
    adapterFetch<Record<string, AdapterLtpEntry>>(
      `/market/ltp${q({ symbols: symbols.join(','), exchange })}`
    ),

  marketCandles: (symbol: string, interval = '5', days = 1, exchange = 'NSE') =>
    adapterFetch<AdapterCandle[]>(
      `/market/candles${q({ symbol, interval, days, exchange })}`
    ),
}
