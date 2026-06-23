import { createHmac } from 'crypto'
import type { BrokerAccount, PortfolioHolding } from '@/app/types'
import { safeDecrypt } from '@/lib/crypto'
import { ExternalAPIError } from '@/app/types'
import type { PositionEntry } from '@/app/api/market/positions/route'

const BASE = 'https://Openapi.5paisa.com/VendorFeeds/api'

// ── RC4 encryption (pure JS — OpenSSL 3.x removed RC4 from node:crypto) ─────
function rc4Encrypt(key: string, plaintext: string): string {
  const S = Array.from({ length: 256 }, (_, i) => i)
  let j = 0
  for (let i = 0; i < 256; i++) {
    j = (j + S[i]! + key.charCodeAt(i % key.length)) % 256
    ;[S[i], S[j]] = [S[j]!, S[i]!]
  }
  let i = 0; j = 0
  const out: number[] = []
  for (let k = 0; k < plaintext.length; k++) {
    i = (i + 1) % 256
    j = (j + S[i]!) % 256
    ;[S[i], S[j]] = [S[j]!, S[i]!]
    out.push(plaintext.charCodeAt(k) ^ S[(S[i]! + S[j]!) % 256]!)
  }
  return Buffer.from(out).toString('base64')
}

// ── RFC 6238 TOTP ─────────────────────────────────────────────────────────────
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
  const code = ((hmac[offset]! & 0x7f) << 24) | ((hmac[offset + 1]! & 0xff) << 16) |
               ((hmac[offset + 2]! & 0xff) << 8) | (hmac[offset + 3]! & 0xff)
  return (code % 10 ** digits).toString().padStart(digits, '0')
}

// ── Credential extraction ─────────────────────────────────────────────────────
interface RawCreds {
  userId: string           // TOTP login User ID (clientCode column)
  password: string         // apiSecret column
  encryptionKey: string    // feedToken column
  appName: string          // totpSecret column
  source: string           // jwtToken column
  userKey: string          // extra.userKey
  realClientCode: string   // extra.realClientCode (demat account code)
  realTotpSecret?: string  // extra.realTotpSecret
  accessToken?: string     // extra.accessToken (pre-generated, optional)
}

function extractRawCreds(account: BrokerAccount): RawCreds | null {
  const rawExtra = safeDecrypt(account.extraCredentials)
  if (!rawExtra) return null
  let extra: Record<string, string> = {}
  try { extra = JSON.parse(rawExtra) } catch { return null }

  const userKey        = extra.userKey        || ''
  const realClientCode = extra.realClientCode || ''

  if (!userKey || !realClientCode) return null

  return {
    userId:          safeDecrypt(account.clientCode) || '',
    password:        safeDecrypt(account.apiSecret)  || '',
    encryptionKey:   safeDecrypt(account.feedToken)  || '',
    appName:         safeDecrypt(account.totpSecret) || '',
    source:          safeDecrypt(account.jwtToken)   || '',
    userKey,
    realClientCode,
    realTotpSecret:  extra.realTotpSecret,
    accessToken:     extra.accessToken,
  }
}

// ── Token acquisition ─────────────────────────────────────────────────────────
function requestHead(requestCode: string, userKey: string, appName: string) {
  return { requestCode, key: userKey, appName, appVer: '1.0', userId: 'PQ' }
}

async function loginWithTotp(creds: RawCreds): Promise<string> {
  if (!creds.realTotpSecret) throw new ExternalAPIError('5paisa TOTP secret not configured', '5paisa')
  if (!creds.password || !creds.encryptionKey) throw new ExternalAPIError('5paisa password/encryption key missing', '5paisa')

  const totp              = generateTOTP(creds.realTotpSecret)
  const encryptedPassword = rc4Encrypt(creds.encryptionKey, creds.password)

  const res = await fetch(`${BASE}/Login/V4/Validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      head: requestHead('5PLoginV4', creds.userKey, creds.appName),
      body: {
        Email_id:       creds.userId,
        Password:       encryptedPassword,
        LocalIP:        '1.1.1.1',
        PublicIP:       '1.1.1.1',
        HDSerialNumber: '',
        MACAddress:     '',
        MachineID:      '1',
        VersionNo:      '1.7',
        RequestNo:      '1',
        My2PIN:         totp,
        ConnectionType: '1',
      },
    }),
  })
  if (!res.ok) throw new ExternalAPIError(`5paisa login ${res.status}: ${res.statusText}`, '5paisa')

  const json = await res.json()
  const body = json?.body
  if (body?.Status !== 0) {
    throw new ExternalAPIError(`5paisa login failed: ${body?.Message ?? JSON.stringify(body)}`, '5paisa')
  }

  const token = body?.JWTToken
  if (!token) throw new ExternalAPIError('5paisa login: no JWTToken in response', '5paisa')
  return token as string
}

// In-memory token cache — avoids re-login on every portfolio fetch
const _tokenCache = new Map<string, { token: string; expiresAt: number }>()
// 5paisa tokens expire at 11:59 PM IST; cache until midnight with 30-min buffer
function tokenTtl(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(23, 29, 0, 0) // 11:29 PM local — 30 min before typical expiry
  const ttl = midnight.getTime() - now.getTime()
  return ttl > 0 ? ttl : 30 * 60 * 1000
}

async function getToken(account: BrokerAccount, creds: RawCreds): Promise<string> {
  // 1. In-memory cache
  const cached = _tokenCache.get(account.id)
  if (cached && cached.expiresAt > Date.now()) return cached.token

  // 2. Stored access token (user-supplied)
  if (creds.accessToken) {
    _tokenCache.set(account.id, { token: creds.accessToken, expiresAt: Date.now() + tokenTtl() })
    return creds.accessToken
  }

  // 3. DB-stored JWT from previous TOTP login (avoids login on every cold start)
  const storedJwt = safeDecrypt(account.jwtToken)
  if (storedJwt) {
    _tokenCache.set(account.id, { token: storedJwt, expiresAt: Date.now() + tokenTtl() })
    return storedJwt
  }

  // 4. Fresh TOTP login
  const token = await loginWithTotp(creds)
  _tokenCache.set(account.id, { token, expiresAt: Date.now() + tokenTtl() })
  // Persist so next cold start skips login
  try {
    const { encrypt } = await import('@/lib/crypto')
    const { prisma } = await import('@/lib/auth')
    await prisma.brokerAccount.update({ where: { id: account.id }, data: { jwtToken: encrypt(token) } })
  } catch { /* non-fatal */ }
  return token
}

function fivePaisaHeaders(token: string) {
  return { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function getFivePaisaHoldings(account: BrokerAccount): Promise<PortfolioHolding[]> {
  const creds = extractRawCreds(account)
  if (!creds) throw new ExternalAPIError('5paisa credentials incomplete (need userKey + realClientCode)', '5paisa')

  const token = await getToken(account, creds)

  const res = await fetch(`${BASE}/Account/Holdings`, {
    method: 'POST',
    headers: fivePaisaHeaders(token),
    body: JSON.stringify({
      head: requestHead('5PHoldings', creds.userKey, creds.appName),
      body: { ClientCode: creds.realClientCode },
    }),
  })
  if (!res.ok) throw new ExternalAPIError(`5paisa holdings ${res.status}: ${res.statusText}`, '5paisa')

  const json = await res.json()
  const status = json?.head?.status ?? json?.body?.Status
  if (status !== '0' && status !== 0) {
    // Token likely expired — clear cache, force fresh TOTP login, retry once
    _tokenCache.delete(account.id)
    const freshCreds = { ...creds, accessToken: undefined }
    // Skip stored JWT too so we force re-login
    const freshToken = await loginWithTotp(freshCreds)
    _tokenCache.set(account.id, { token: freshToken, expiresAt: Date.now() + tokenTtl() })
    const retry = await fetch(`${BASE}/Account/Holdings`, {
      method: 'POST',
      headers: fivePaisaHeaders(freshToken),
      body: JSON.stringify({
        head: requestHead('5PHoldings', creds.userKey, creds.appName),
        body: { ClientCode: creds.realClientCode },
      }),
    })
    if (!retry.ok) throw new ExternalAPIError(`5paisa holdings retry ${retry.status}`, '5paisa')
    const json2 = await retry.json()
    const status2 = json2?.head?.status ?? json2?.body?.Status
    if (status2 !== '0' && status2 !== 0) {
      throw new ExternalAPIError(`5paisa holdings: ${json2?.head?.statusDescription ?? json2?.body?.Message ?? status2}`, '5paisa')
    }
    return mapHoldings(json2?.body?.Data ?? [], account.id)
  }

  return mapHoldings(json?.body?.Data ?? [], account.id)
}

function mapHoldings(items: any[], brokerAccountId: string): PortfolioHolding[] {
  return items.map((h): PortfolioHolding => {
    const qty      = h.Qty ?? 0
    const avgPrice = h.AvgRate ?? 0
    const ltp      = h.LTP ?? 0
    const invested = avgPrice * qty
    const pnl      = h.ProfitAndLoss ?? (ltp - avgPrice) * qty
    return {
      symbol:           h.Symbol ?? '',
      name:             h.Symbol ?? '',
      quantity:         qty,
      avgPrice,
      currentPrice:     ltp,
      marketValue:      h.CurrentValue ?? ltp * qty,
      gainLoss:         pnl,
      gainLossPercent:  invested > 0 ? (pnl / invested) * 100 : 0,
      change:           0,
      changePercent:    h.PChange ?? 0,
      aiRecommendation: 'HOLD' as const,
      confidence:       0,
      insight:          '',
      brokerAccountId,
    }
  })
}

export async function getFivePaisaPositions(account: BrokerAccount): Promise<PositionEntry[]> {
  const creds = extractRawCreds(account)
  if (!creds) throw new ExternalAPIError('5paisa credentials incomplete', '5paisa')

  const token = await getToken(account, creds)

  const res = await fetch(`${BASE}/Account/NetPositionNetWise`, {
    method: 'POST',
    headers: fivePaisaHeaders(token),
    body: JSON.stringify({
      head: requestHead('5PNetPositionNetWise', creds.userKey, creds.appName),
      body: { ClientCode: creds.realClientCode },
    }),
  })
  if (!res.ok) throw new ExternalAPIError(`5paisa positions ${res.status}: ${res.statusText}`, '5paisa')

  const json = await res.json()
  const items: any[] = json?.body?.NetPositionDetail ?? []

  return items
    .filter(p => (p.NetQty ?? 0) !== 0 || (p.MTOM ?? 0) !== 0)
    .map((p): PositionEntry => {
      const netQty   = Math.abs(p.NetQty ?? 0)
      const avgPrice = p.BuyAvgRate ?? p.SellAvgRate ?? 0
      const ltp      = p.LTP ?? 0
      const mtom     = p.MTOM ?? 0
      const side     = (p.BuySellInd === 'S' ? 'SELL' : 'BUY') as 'BUY' | 'SELL'
      const productMap: Record<string, string> = { I: 'MIS', D: 'CNC', F: 'NRML', O: 'NRML' }
      const product  = (productMap[p.ProductType] ?? p.ProductType ?? 'MIS') as PositionEntry['product']
      return {
        symbol:        p.ScripName ?? '',
        qty:           netQty,
        avgPrice,
        ltp,
        pnl:           mtom,
        pnlPercent:    avgPrice > 0 && netQty > 0 ? (mtom / (avgPrice * netQty)) * 100 : 0,
        product,
        side,
        broker:        '5paisa',
        realisedPnl:   p.BookedPL ?? 0,
        unrealisedPnl: mtom,
      }
    })
}
