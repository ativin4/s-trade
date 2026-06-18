import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { safeDecrypt } from '@/lib/crypto'

const ADAPTER_URL    = process.env.BROKER_ADAPTER_URL
const ADAPTER_SECRET = process.env.BROKER_ADAPTER_SECRET

// Map DB fields → Oracle VM env var names per broker
type EnvMap = { clientCode?: string; apiSecret?: string; totpSecret?: string; jwtToken?: string; feedToken?: string }
const FIELD_MAP: Record<string, EnvMap> = {
  groww:    { clientCode: 'GROWW_API_KEY',     totpSecret: 'GROWW_TOTP_SECRET' },
  zerodha:  { clientCode: 'KITE_API_KEY',      apiSecret: 'KITE_API_SECRET',   jwtToken: 'KITE_ACCESS_TOKEN' },
  upstox:   { clientCode: 'UPSTOX_API_KEY',    apiSecret: 'UPSTOX_API_SECRET', jwtToken: 'UPSTOX_ACCESS_TOKEN' },
  angelone: { jwtToken:   'ANGEL_API_KEY',     clientCode: 'ANGEL_CLIENT_ID',  apiSecret: 'ANGEL_PIN', totpSecret: 'ANGEL_TOTP_SECRET' },
  // 5paisa's Connect API needs 6 app-level fields; totpSecret/jwtToken/feedToken are repurposed to carry APP_NAME/SOURCE/ENCRYPTION_KEY.
  // Login-specific fields (User Key, real Client Code, account TOTP secret, PIN) live in extraCredentials — see below.
  '5paisa': { clientCode: 'FIVEPAISA_USER_ID', apiSecret: 'FIVEPAISA_PASSWORD', totpSecret: 'FIVEPAISA_APP_NAME', jwtToken: 'FIVEPAISA_SOURCE', feedToken: 'FIVEPAISA_ENCRYPTION_KEY' },
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { accountId } = await req.json()
  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })

  const account = await prisma.brokerAccount.findFirst({
    where: { id: accountId, userId: session.user.id },
  })
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const brokerKey = account.brokerName.toLowerCase()

  // Build env vars from decrypted credentials
  const fieldMap = FIELD_MAP[brokerKey]
  if (!fieldMap) return NextResponse.json({ error: `Broker '${account.brokerName}' not supported by adapter` }, { status: 400 })

  const env: Record<string, string> = {}
  const fields: Array<keyof EnvMap> = ['clientCode', 'apiSecret', 'totpSecret', 'jwtToken', 'feedToken']
  for (const field of fields) {
    const envKey = fieldMap[field]
    if (!envKey) continue
    const raw = account[field as keyof typeof account] as string | null
    const val = safeDecrypt(raw)
    if (val) env[envKey] = val
  }
  // 5paisa login needs extra fields beyond the named columns: User Key, real (demat) Client Code, account TOTP secret, PIN
  if (brokerKey === '5paisa' && account.extraCredentials) {
    const decrypted = safeDecrypt(account.extraCredentials)
    const extra = decrypted ? JSON.parse(decrypted) as Record<string, string> : {}
    if (extra.userKey)        env.FIVEPAISA_USER_KEY     = extra.userKey
    if (extra.realClientCode) env.FIVEPAISA_CLIENT_CODE  = extra.realClientCode
    if (extra.realTotpSecret) env.FIVEPAISA_TOTP_SECRET  = extra.realTotpSecret
    if (extra.pin)            env.FIVEPAISA_PIN          = extra.pin
    if (extra.accessToken)    env.FIVEPAISA_ACCESS_TOKEN = extra.accessToken
  }

  // Push credentials to Oracle VM adapter
  if (ADAPTER_URL && ADAPTER_SECRET) {
    const res = await fetch(`${ADAPTER_URL}/credentials/${brokerKey}`, {
      method: 'POST',
      headers: { 'x-api-key': ADAPTER_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ env }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return NextResponse.json({ error: `Adapter rejected credentials: ${detail}` }, { status: 502 })
    }
  }

  // Toggle this account's adapter-active flag (multiple can be active simultaneously)
  await prisma.brokerAccount.update({
    where: { id: accountId },
    data: { isAdapterActive: true },
  })

  return NextResponse.json({ success: true, broker: account.brokerName, adapterConfigured: Boolean(ADAPTER_URL) })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { accountId } = await req.json().catch(() => ({}))

  if (accountId) {
    // Unsync a specific account
    const account = await prisma.brokerAccount.findFirst({
      where: { id: accountId, userId: session.user.id },
    })
    if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.brokerAccount.update({ where: { id: accountId }, data: { isAdapterActive: false } })
  } else {
    // Unsync all
    await prisma.brokerAccount.updateMany({
      where: { userId: session.user.id },
      data: { isAdapterActive: false },
    })
  }

  return NextResponse.json({ success: true })
}
