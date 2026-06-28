import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchPositions } from '@/lib/services/positions'

export interface PositionEntry {
  symbol: string
  qty: number
  avgPrice: number
  ltp: number
  pnl: number
  pnlPercent: number
  product: 'MIS' | 'CNC' | 'NRML' | 'MTF' | string
  side: 'BUY' | 'SELL'
  broker: string
  realisedPnl: number
  unrealisedPnl: number
  mtfInterest?: number
  paper?: boolean
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const positions = await fetchPositions(session.user.id)
  return NextResponse.json(positions)
}
