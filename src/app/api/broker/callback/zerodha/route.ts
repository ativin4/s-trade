import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { safeDecrypt } from '@/lib/crypto'
import { revalidatePath } from 'next/cache'
import { exchangeRequestToken, pushZerodhaTokenToAdapter } from '@/lib/services/zerodha'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.redirect(new URL('/auth/signin', req.url))

  const { searchParams } = req.nextUrl
  const requestToken = searchParams.get('request_token')
  const status       = searchParams.get('status')

  if (status !== 'success' || !requestToken) {
    return NextResponse.redirect(new URL('/brokers?zerodha=error', req.url))
  }

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

  try {
    const accessToken = await exchangeRequestToken(apiKey, apiSecret, requestToken)
    await pushZerodhaTokenToAdapter(account.id, apiKey, accessToken)
  } catch (e) {
    const msg = encodeURIComponent((e as Error).message)
    return NextResponse.redirect(new URL(`/brokers?zerodha=token_error&msg=${msg}`, req.url))
  }

  revalidatePath('/brokers')
  revalidatePath('/dashboard')

  return NextResponse.redirect(new URL('/brokers?zerodha=authorized', req.url))
}
