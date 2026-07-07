import { createHash, createHmac } from 'crypto'
import { ExternalAPIError } from '@/app/types'

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
  // last value wins for duplicates
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
 * Flow (mirrors standard Python kiteconnect automation):
 *   1. GET connect/login  — seeds session cookies
 *   2. POST api/login     — password auth → request_id
 *   3. POST api/twofa     — TOTP auth → sets enc_token cookie
 *   4. GET connect/login  — with enc_token → redirects to app redirect_url?request_token=xxx
 *   5. POST session/token — request_token + checksum → access_token
 */
export async function getZerodhaAccessToken(
  apiKey: string,
  apiSecret: string,
  userId: string,
  password: string,
  totpSecret: string,
): Promise<string> {
  const headers = (extra: Record<string, string> = {}) => ({
    'User-Agent': UA,
    'Accept': 'application/json, text/plain, */*',
    ...extra,
  })

  // Step 1 — seed session cookies
  const seedRes = await fetch(`https://kite.zerodha.com/connect/login?v=3&api_key=${apiKey}`, {
    redirect: 'manual',
    headers: headers(),
  })
  let cookies = extractCookies(seedRes)

  // Step 2 — password login
  const loginRes = await fetch('https://kite.zerodha.com/api/login', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookies }),
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

  // Step 3 — TOTP 2FA (sets enc_token / public_token cookies)
  const totpCode = generateTOTP(totpSecret)
  const twoFaRes = await fetch('https://kite.zerodha.com/api/twofa', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookies }),
    body: new URLSearchParams({ user_id: userId, request_id: requestId, twofa_value: totpCode, twofa_type: 'totp' }),
    redirect: 'manual',
  })
  cookies = extractCookies(twoFaRes, cookies)
  if (!twoFaRes.ok && twoFaRes.status !== 302) {
    const body = await twoFaRes.text().catch(() => '')
    throw new ExternalAPIError(`Zerodha 2FA failed (${twoFaRes.status}): ${body.slice(0, 200)}`, 'zerodha')
  }

  // Step 4 — re-hit connect/login with auth cookies → redirects to redirect_url?request_token=xxx
  const connectRes = await fetch(`https://kite.zerodha.com/connect/login?v=3&api_key=${apiKey}`, {
    redirect: 'manual',
    headers: headers({ 'Cookie': cookies }),
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
      `Zerodha: no request_token in connect/login redirect. Location: "${location}". ` +
      `Cookies present: ${cookies.split(';').map(c => c.trim().split('=')[0]).join(', ')}`,
      'zerodha'
    )
  }

  // Step 5 — exchange request_token for access_token
  const checksum = createHash('sha256').update(apiKey + requestToken + apiSecret).digest('hex')
  const sessionRes = await fetch('https://api.kite.trade/session/token', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/x-www-form-urlencoded', 'X-Kite-Version': '3' }),
    body: new URLSearchParams({ api_key: apiKey, request_token: requestToken, checksum }),
  })
  const sessionJson = await sessionRes.json().catch(() => ({})) as Record<string, unknown>
  if (sessionJson.status !== 'success') {
    const msg = (sessionJson.message as string | undefined) ?? sessionRes.statusText
    throw new ExternalAPIError(`Zerodha session token failed: ${msg}`, 'zerodha')
  }
  const token = ((sessionJson.data as Record<string, unknown>)?.access_token as string | undefined)
  if (!token) throw new ExternalAPIError('Zerodha session returned no access_token', 'zerodha')
  return token
}
