import { createHmac } from 'crypto'
import type { BrokerAccount, PortfolioHolding } from '@/app/types'
import { safeDecrypt } from '@/lib/crypto'

// RFC 6238 TOTP — no external dep needed
function generateTOTP(base32Secret: string, period = 30, digits = 6): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const secret = base32Secret.toUpperCase().replace(/=+$/, '')
  const bytes: number[] = []
  let bits = 0, value = 0
  for (const ch of secret) {
    const idx = alphabet.indexOf(ch)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) { bits -= 8; bytes.push((value >> bits) & 0xff) }
  }
  const key = Buffer.from(bytes)
  const counter = Math.floor(Date.now() / 1000 / period)
  const buf = Buffer.alloc(8)
  buf.writeBigInt64BE(BigInt(counter))
  const hmac = createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1]! & 0x0f
  const code = ((hmac[offset]! & 0x7f) << 24) | ((hmac[offset + 1]! & 0xff) << 16) | ((hmac[offset + 2]! & 0xff) << 8) | (hmac[offset + 3]! & 0xff)
  return (code % 10 ** digits).toString().padStart(digits, '0')
}
import { ExternalAPIError } from '@/app/types'

const GROWW_API = 'https://api.groww.in/v1'
const API_VERSION = '1.0'

function growwHeaders(token: string) {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-API-VERSION': API_VERSION,
  }
}

export async function getGrowwAccessToken(account: BrokerAccount): Promise<string> {
  if (!account.clientCode) throw new ExternalAPIError('Missing Groww API key', 'groww')

  const apiKey = safeDecrypt(account.clientCode) ?? account.clientCode
  const totpSecret = safeDecrypt(account.totpSecret)
  const apiSecret = safeDecrypt(account.apiSecret)

  // TOTP flow: auto-generate OTP from stored secret
  if (totpSecret) {
    const totp = generateTOTP(totpSecret)
    const res = await fetch(`${GROWW_API}/token/api/access`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key_type: 'totp', totp }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ExternalAPIError(`Groww TOTP auth failed: ${body?.message || res.statusText}`, 'groww')
    }
    const data = await res.json()
    return data.access_token
  }

  // Checksum flow: HMAC-SHA256(apiSecret, timestamp)
  if (apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const checksum = createHmac('sha256', apiSecret).update(timestamp).digest('hex')
    const res = await fetch(`${GROWW_API}/token/api/access`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key_type: 'approval', checksum, timestamp }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ExternalAPIError(`Groww auth failed: ${body?.message || res.statusText}`, 'groww')
    }
    const data = await res.json()
    return data.access_token
  }

  throw new ExternalAPIError('Missing Groww credentials (need API key + TOTP secret or API secret)', 'groww')
}

async function growwFetch(account: BrokerAccount, url: string): Promise<Response> {
  const stored = safeDecrypt(account.jwtToken)
  const token  = stored || await getGrowwAccessToken(account)
  const res    = await fetch(url, { headers: growwHeaders(token) })
  if (res.status !== 401) return res
  // Token expired — re-auth, persist, retry
  const freshToken = await getGrowwAccessToken(account)
  if (account.id) {
    const { encrypt } = await import('@/lib/crypto')
    const { prisma }  = await import('@/lib/auth')
    await prisma.brokerAccount.update({
      where: { id: account.id },
      data: { jwtToken: encrypt(freshToken) },
    }).catch(() => {})
  }
  return fetch(url, { headers: growwHeaders(freshToken) })
}

export async function getGrowwHoldings(account: BrokerAccount): Promise<PortfolioHolding[]> {
  const res = await growwFetch(account, `${GROWW_API}/holdings/user`)
  if (!res.ok) throw new ExternalAPIError(`Groww holdings failed: ${res.statusText}`, 'groww')
  return mapGrowwHoldings(await res.json(), account.id)
}

export async function getGrowwPositions(account: BrokerAccount) {
  const res = await growwFetch(account, `${GROWW_API}/positions`)
  if (!res.ok) throw new ExternalAPIError(`Groww positions failed: ${res.statusText}`, 'groww')
  return res.json()
}

export async function getGrowwMargin(account: BrokerAccount) {
  const res = await growwFetch(account, `${GROWW_API}/margin`)
  if (!res.ok) throw new ExternalAPIError(`Groww margin failed: ${res.statusText}`, 'groww')
  return res.json()
}

export async function placeGrowwOrder(
  account: BrokerAccount,
  order: {
    trading_symbol: string
    quantity: number
    price?: number
    trigger_price?: number
    validity: 'DAY' | 'IOC'
    exchange: 'NSE' | 'BSE'
    segment: 'CASH' | 'FNO'
    product: 'CNC' | 'MIS' | 'NRML'
    order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M'
    transaction_type: 'BUY' | 'SELL'
    order_reference_id?: string
  }
): Promise<{ groww_order_id: string }> {
  const token = safeDecrypt(account.jwtToken) || await getGrowwAccessToken(account)

  const res = await fetch(`${GROWW_API}/order/create`, {
    method: 'POST',
    headers: growwHeaders(token),
    body: JSON.stringify(order),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new ExternalAPIError(
      `Groww order failed: ${err.message || res.statusText}`,
      'groww'
    )
  }

  return res.json()
}

export async function cancelGrowwOrder(
  account: BrokerAccount,
  groww_order_id: string,
  segment: 'CASH' | 'FNO' = 'CASH'
): Promise<void> {
  const token = safeDecrypt(account.jwtToken) || await getGrowwAccessToken(account)
  const res = await fetch(`${GROWW_API}/order/cancel`, {
    method: 'POST',
    headers: growwHeaders(token),
    body: JSON.stringify({ groww_order_id, segment }),
  })
  if (!res.ok) throw new ExternalAPIError(`Groww cancel failed: ${res.statusText}`, 'groww')
}

export async function getGrowwOrderDetails(
  account: BrokerAccount,
  groww_order_id: string,
  segment: 'CASH' | 'FNO' = 'CASH'
) {
  const token = safeDecrypt(account.jwtToken) || await getGrowwAccessToken(account)
  const res = await fetch(`${GROWW_API}/order/detail/${groww_order_id}?segment=${segment}`, {
    headers: growwHeaders(token),
  })
  if (!res.ok) throw new ExternalAPIError(`Groww order detail failed: ${res.statusText}`, 'groww')
  return res.json()
}

function mapGrowwHoldings(data: any, brokerAccountId: string): PortfolioHolding[] {
  const holdings = data?.data || data?.holdings || []
  return holdings.map((h: any) => ({
    symbol: h.trading_symbol || h.symbol,
    name: h.company_name || h.trading_symbol || h.symbol,
    quantity: h.quantity || h.total_quantity || 0,
    avgPrice: h.average_price || 0,
    currentPrice: h.ltp || h.current_price || 0,
    change: h.day_change || 0,
    changePercent: h.day_change_percentage || 0,
    marketValue: h.current_value || (h.quantity * (h.ltp || 0)),
    gainLoss: h.pnl || h.unrealized_pnl || 0,
    gainLossPercent: h.pnl_percentage || 0,
    aiRecommendation: 'HOLD' as const,
    confidence: 0,
    insight: '',
    brokerAccountId,
  }))
}
