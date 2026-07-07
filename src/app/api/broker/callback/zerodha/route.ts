import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { safeDecrypt, encrypt } from '@/lib/crypto'
import { revalidatePath } from 'next/cache'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.redirect(new URL('/auth/signin', req.url))

  const { searchParams } = req.nextUrl
  const requestToken = searchParams.get('request_token')
  const status       = searchParams.get('status')

  if (status !== 'success' || !requestToken) {
    return NextResponse.redirect(new URL('/brokers?zerodha=error', req.url))
  }

  // Find user's Zerodha account
  const account = await prisma.brokerAccount.findFirst({
    where: { userId: session.user.id, brokerName: 'zerodha' },
    select: { id: true, clientCode: true, apiSecret: true },
  })
  if (!account) return NextResponse.redirect(new URL('/brokers?zerodha=no_account', req.url))

  const apiKey    = safeDecrypt(account.clientCode)
  const apiSecret = safeDecrypt(account.apiSecret)
  if (!apiKey || !apiSecret) {
    return NextResponse.redirect(new URL('/brokers?zerodha=missing_creds', req.url))
  }

  // Exchange request_token for access_token
  const checksum = createHash('sha256').update(apiKey + requestToken + apiSecret).digest('hex')
  const res = await fetch('https://api.kite.trade/session/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Kite-Version': '3' },
    body: new URLSearchParams({ api_key: apiKey, request_token: requestToken, checksum }),
  })
  const json = await res.json().catch(() => ({})) as Record<string, unknown>
  if (json.status !== 'success') {
    const msg = encodeURIComponent((json.message as string | undefined) ?? res.statusText)
    return NextResponse.redirect(new URL(`/brokers?zerodha=token_error&msg=${msg}`, req.url))
  }

  const accessToken = ((json.data as Record<string, unknown>)?.access_token as string | undefined)
  if (!accessToken) return NextResponse.redirect(new URL('/brokers?zerodha=no_token', req.url))

  await prisma.brokerAccount.update({
    where: { id: account.id },
    data: { jwtToken: encrypt(accessToken) },
  })

  revalidatePath('/brokers')
  revalidatePath('/dashboard')

  return NextResponse.redirect(new URL('/brokers?zerodha=authorized', req.url))
}
