import { createHash, createHmac } from 'crypto'
import { ExternalAPIError } from '@/app/types'
import { prisma } from '@/lib/auth'
import { encrypt } from '@/lib/crypto'

// RFC 6238 TOTP (same impl as groww.ts — no external dep)
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

// Merge Set-Cookie headers into a single Cookie string for subsequent requests
function extractCookies(res: Response, existing = ''): string {
  const raw = res.headers.getSetCookie?.() ?? []
  const pairs = [
    ...existing.split(';').map(s => s.trim()).filter(Boolean),
    ...raw.map(c => c.split(';')[0]!.trim()),
  ]
  const map = new Map<string, string>()
  for (const pair of pairs) {
    const eq = pair.indexOf('=')
    if (eq === -1) continue
    map.set(pair.slice(0, eq), pair.slice(eq + 1))
  }
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

/**
 * Full automated Kite Connect login:
 *   user_id + password + TOTP → request_token → access_token
 *
 * Flow:
 *   1. GET  kite.zerodha.com/connect/login  — seed session cookies
 *   2. POST kite.zerodha.com/api/login      — password auth → request_id
 *   3. POST kite.zerodha.com/api/twofa      — TOTP → sets enc_token cookie
 *   4. GET  kite.zerodha.com/connect/login  — with enc_token → redirects to
 *                                             redirect_url?request_token=xxx
 *   5. POST api.kite.trade/session/token    — checksum exchange → access_token
 */
export async function getZerodhaAccessToken(
  apiKey: string,
  apiSecret: string,
  userId: string,
  password: string,
  totpSecret: string,
): Promise<string> {
  const h = (extra: Record<string, string> = {}) => ({
    'User-Agent': UA,
    'Accept': 'application/json, text/plain, */*',
    ...extra,
  })

  // Step 1 — seed session cookies
  const seedRes = await fetch(`https://kite.zerodha.com/connect/login?v=3&api_key=${apiKey}`, {
    redirect: 'manual',
    headers: h(),
  })
  let cookies = extractCookies(seedRes)

  // Step 2 — password login
  const loginRes = await fetch('https://kite.zerodha.com/api/login', {
    method: 'POST',
    headers: h({ 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookies }),
    body: new URLSearchParams({ user_id: userId, password }),
  })
  cookies = extractCookies(loginRes, cookies)
  const loginJson = await loginRes.json().catch(() => ({})) as Record<string, unknown>
  if (loginJson.status !== 'success') {
    const msg = (loginJson.message as string | undefined) ?? loginRes.statusText
    throw new ExternalAPIError(`Zerodha login failed: ${msg}`, 'zerodha')
  }
  const requestId = (loginJson.data as Record<string, string>).request_id ?? ''
  if (!requestId) throw new ExternalAPIError('Zerodha login returned no request_id', 'zerodha')

  // Step 3 — TOTP 2FA (sets enc_token cookie)
  const totpCode = generateTOTP(totpSecret)
  const twoFaRes = await fetch('https://kite.zerodha.com/api/twofa', {
    method: 'POST',
    headers: h({ 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookies }),
    body: new URLSearchParams({ user_id: userId, request_id: requestId, twofa_value: totpCode, twofa_type: 'totp' }),
    redirect: 'manual',
  })
  cookies = extractCookies(twoFaRes, cookies)
  if (!twoFaRes.ok && twoFaRes.status !== 302) {
    const body = await twoFaRes.text().catch(() => '')
    throw new ExternalAPIError(`Zerodha 2FA failed (${twoFaRes.status}): ${body.slice(0, 200)}`, 'zerodha')
  }

  // Step 4 — connect/login with auth cookies → redirects with request_token
  const connectRes = await fetch(`https://kite.zerodha.com/connect/login?v=3&api_key=${apiKey}`, {
    redirect: 'manual',
    headers: h({ Cookie: cookies }),
  })
  const location = connectRes.headers.get('location') ?? ''
  let requestToken: string | null = null
  try { requestToken = new URL(location).searchParams.get('request_token') } catch { /* */ }
  if (!requestToken) {
    const match = location.match(/[?&]request_token=([^&]+)/)
    requestToken = match?.[1] ?? null
  }
  if (!requestToken) {
    throw new ExternalAPIError(
      `Zerodha: no request_token in redirect. Location: "${location}". ` +
      `Cookies: ${cookies.split(';').map(c => c.trim().split('=')[0]).join(', ')}`,
      'zerodha'
    )
  }

  // Step 5 — exchange request_token for access_token
  return exchangeRequestToken(apiKey, apiSecret, requestToken)
}

/** Exchange a Kite request_token for an access_token. */
export async function exchangeRequestToken(apiKey: string, apiSecret: string, requestToken: string): Promise<string> {
  const checksum = createHash('sha256').update(apiKey + requestToken + apiSecret).digest('hex')
  const res = await fetch('https://api.kite.trade/session/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Kite-Version': '3' },
    body: new URLSearchParams({ api_key: apiKey, request_token: requestToken, checksum }),
  })
  const json = await res.json().catch(() => ({})) as Record<string, unknown>
  if (json.status !== 'success') {
    const msg = (json.message as string | undefined) ?? res.statusText
    throw new ExternalAPIError(`Zerodha session token failed: ${msg}`, 'zerodha')
  }
  const token = ((json.data as Record<string, unknown>)?.access_token as string | undefined)
  if (!token) throw new ExternalAPIError('Zerodha session returned no access_token', 'zerodha')
  return token
}

/** Push access_token to adapter and mark account as adapter-active. */
export async function pushZerodhaTokenToAdapter(accountId: string, apiKey: string, accessToken: string): Promise<void> {
  const adapterUrl    = process.env.BROKER_ADAPTER_URL
  const adapterSecret = process.env.BROKER_ADAPTER_SECRET
  if (!adapterUrl || !adapterSecret) return

  const res = await fetch(`${adapterUrl}/credentials/zerodha`, {
    method: 'POST',
    headers: { 'x-api-key': adapterSecret, 'Content-Type': 'application/json' },
    body: JSON.stringify({ env: { KITE_API_KEY: apiKey, KITE_ACCESS_TOKEN: accessToken } }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new ExternalAPIError(`Adapter rejected Zerodha credentials: ${detail}`, 'zerodha')
  }

  await prisma.brokerAccount.update({
    where: { id: accountId },
    data: { jwtToken: encrypt(accessToken), isAdapterActive: true },
  })
}
