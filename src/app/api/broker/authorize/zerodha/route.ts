import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { safeDecrypt } from '@/lib/crypto'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.redirect(new URL('/auth/signin', req.url))

  const accountId = req.nextUrl.searchParams.get('accountId')
  const account = await prisma.brokerAccount.findFirst({
    where: { id: accountId ?? '', userId: session.user.id, brokerName: 'zerodha' },
    select: { clientCode: true },
  })
  if (!account) return NextResponse.json({ error: 'Zerodha account not found' }, { status: 404 })

  const apiKey = safeDecrypt(account.clientCode)
  if (!apiKey) return NextResponse.json({ error: 'API key missing' }, { status: 400 })

  const loginUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(apiKey)}`
  return NextResponse.redirect(loginUrl)
}
