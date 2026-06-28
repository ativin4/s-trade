import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBrokerAccounts } from '@/lib/broker'
import { getGrowwPositions } from '@/lib/services/groww'
import { isGrowwMcp } from '@/lib/broker-constants'
import { fetchPositions } from '@/lib/services/positions'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accounts = await getBrokerAccounts(session.user.id)
  const groww = accounts.find(a => a.brokerName === 'groww' && !isGrowwMcp(a))

  let raw: unknown = null
  let rawError: string | null = null
  if (groww) {
    try {
      raw = await getGrowwPositions(groww)
    } catch (e) {
      rawError = (e as Error).message
    }
  }

  let normalized: unknown = null
  let normalizedError: string | null = null
  try {
    normalized = await fetchPositions(session.user.id)
  } catch (e) {
    normalizedError = (e as Error).message
  }

  return NextResponse.json({
    hasGrowwAccount: !!groww,
    raw,
    rawError,
    normalized,
    normalizedError,
  })
}
