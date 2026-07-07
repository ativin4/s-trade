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

/**
 * Full automated Kite Connect login:
 *   user_id + password + TOTP → request_token → access_token
 *
 * Requires the Kite Connect app's redirect URL to be registered at kite.trade.
 * The redirect is intercepted by not following it (redirect: 'manual').
 */
export async function getZerodhaAccessToken(
  apiKey: string,
  apiSecret: string,
  userId: string,
  password: string,
  totpSecret: string,
): Promise<string> {
  // Step 1 — username + password login
  const loginRes = await fetch('https://kite.trade/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ user_id: userId, password }),
  })
  const loginJson = await loginRes.json().catch(() => ({})) as Record<string, unknown>
  if (loginJson.status !== 'success') {
    const msg = (loginJson.message as string | undefined) ?? loginRes.statusText
    throw new ExternalAPIError(`Zerodha login failed: ${msg}`, 'zerodha')
  }
  const requestId = (loginJson.data as Record<string, string>).request_id ?? ''
  if (!requestId) throw new ExternalAPIError('Zerodha login returned no request_id', 'zerodha')

  // Step 2 — TOTP 2FA
  const totpCode = generateTOTP(totpSecret)
  const twoFaRes = await fetch('https://kite.trade/api/twofa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ user_id: userId, request_id: requestId, twofa_value: totpCode, twofa_type: 'totp' }),
    redirect: 'manual',
  })

  // Zerodha redirects to the app's redirect_url with ?request_token=...
  const location = twoFaRes.headers.get('location') ?? ''
  let requestToken: string | null = null
  try {
    requestToken = new URL(location).searchParams.get('request_token')
  } catch { /* location not a full URL — try substring parse */ }
  if (!requestToken) {
    // Some setups return relative redirect — extract from query string directly
    const match = location.match(/[?&]request_token=([^&]+)/)
    requestToken = match?.[1] ?? null
  }
  if (!requestToken) {
    const body = await twoFaRes.text().catch(() => '')
    throw new ExternalAPIError(`Zerodha TOTP step failed — no request_token in redirect. Location: ${location}. Body: ${body.slice(0, 200)}`, 'zerodha')
  }

  // Step 3 — exchange request_token for access_token
  const checksum = createHash('sha256').update(apiKey + requestToken + apiSecret).digest('hex')
  const sessionRes = await fetch('https://api.kite.trade/session/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Kite-Version': '3',
    },
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
