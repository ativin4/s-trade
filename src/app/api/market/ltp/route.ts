import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchLtp, resolveGrowwToken } from '@/lib/services/market-ltp'

export type { LtpEntry } from '@/lib/services/market-ltp'

export async function GET(req: NextRequest) {
  const raw      = req.nextUrl.searchParams.get('symbols') ?? ''
  const symbols  = raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 50)
  const exchange = req.nextUrl.searchParams.get('exchange') ?? 'NSE'
  if (!symbols.length) return NextResponse.json({})

  const session = await getServerSession(authOptions)
  const growwToken = session?.user?.id
    ? await resolveGrowwToken(session.user.id).catch(() => null)
    : null

  return NextResponse.json(await fetchLtp(symbols, exchange, growwToken))
}
