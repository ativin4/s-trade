/**
 * Shared logic for pushing DB credentials to the Oracle VM broker adapter.
 * Used by both the activate API route and the lazy re-sync on credential errors.
 */
import { prisma } from '@/lib/auth'
import { safeDecrypt } from '@/lib/crypto'

type EnvMap = { clientCode?: string; apiSecret?: string; totpSecret?: string; jwtToken?: string; feedToken?: string }

const FIELD_MAP: Record<string, EnvMap> = {
  groww:    { clientCode: 'GROWW_API_KEY',      totpSecret: 'GROWW_TOTP_SECRET' },
  zerodha:  { clientCode: 'KITE_API_KEY',       apiSecret:  'KITE_API_SECRET',  jwtToken: 'KITE_ACCESS_TOKEN' },
  upstox:   { clientCode: 'UPSTOX_API_KEY',     apiSecret:  'UPSTOX_API_SECRET', jwtToken: 'UPSTOX_ACCESS_TOKEN' },
  angelone: { jwtToken:   'ANGEL_API_KEY',      clientCode: 'ANGEL_CLIENT_ID',  apiSecret: 'ANGEL_PIN', totpSecret: 'ANGEL_TOTP_SECRET' },
  '5paisa': { clientCode: 'FIVEPAISA_USER_ID',  apiSecret:  'FIVEPAISA_PASSWORD', totpSecret: 'FIVEPAISA_APP_NAME', jwtToken: 'FIVEPAISA_SOURCE', feedToken: 'FIVEPAISA_ENCRYPTION_KEY' },
}

/** Build env map + push to adapter. Throws if adapter rejects. */
export async function pushAccountToAdapter(accountId: string): Promise<void> {
  const adapterUrl    = process.env.BROKER_ADAPTER_URL
  const adapterSecret = process.env.BROKER_ADAPTER_SECRET
  if (!adapterUrl || !adapterSecret) return

  const account = await prisma.brokerAccount.findUnique({ where: { id: accountId } })
  if (!account) throw new Error(`Account ${accountId} not found`)

  const brokerKey = account.brokerName.toLowerCase()
  const fieldMap  = FIELD_MAP[brokerKey]
  if (!fieldMap) throw new Error(`Broker '${brokerKey}' not in adapter field map`)

  const env: Record<string, string> = {}
  for (const field of ['clientCode', 'apiSecret', 'totpSecret', 'jwtToken', 'feedToken'] as const) {
    const envKey = fieldMap[field]
    if (!envKey) continue
    const val = safeDecrypt(account[field as keyof typeof account] as string | null)
    if (val) env[envKey] = val
  }

  if (brokerKey === '5paisa' && account.extraCredentials) {
    const extra = JSON.parse(safeDecrypt(account.extraCredentials) ?? '{}') as Record<string, string>
    if (extra.userKey)        env.FIVEPAISA_USER_KEY     = extra.userKey
    if (extra.realClientCode) env.FIVEPAISA_CLIENT_CODE  = extra.realClientCode
    if (extra.realTotpSecret) env.FIVEPAISA_TOTP_SECRET  = extra.realTotpSecret
    if (extra.pin)            env.FIVEPAISA_PIN          = extra.pin
    if (extra.accessToken)    env.FIVEPAISA_ACCESS_TOKEN = extra.accessToken
  }

  const res = await fetch(`${adapterUrl}/credentials/${brokerKey}`, {
    method: 'POST',
    headers: { 'x-api-key': adapterSecret, 'Content-Type': 'application/json' },
    body: JSON.stringify({ env }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Adapter rejected credentials for ${brokerKey}: ${detail}`)
  }
}

const MISSING_CREDS_RE = /Missing\s+\w+(?:_API_KEY|_ACCESS_TOKEN|_TOTP_SECRET)/i

/** True when an adapter error means "credentials lost after restart — safe to retry". */
export function isAdapterCredentialError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return MISSING_CREDS_RE.test(msg)
}
