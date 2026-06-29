import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBrokerAccounts } from '@/lib/broker'
import { isGrowwMcp } from '@/lib/broker-constants'
import { fetchPositions } from '@/lib/services/positions'
import { resolveGrowwToken } from '@/lib/services/market-ltp'

const GROWW_WEB_PATHS = [
  'https://groww.in/v1/api/stocks_portfolio/v1/equity/positions',
  'https://groww.in/v1/api/stocks_portfolio/v1/equity/mtf/positions',
  'https://groww.in/v1/api/portfolio/v1/user/portfolio',
  'https://api.groww.in/v1/user/portfolio/positions',
  'https://api.groww.in/v2/user/portfolio/positions',
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accounts = await getBrokerAccounts(session.user.id)
  const groww = accounts.find(a => a.brokerName === 'groww' && !isGrowwMcp(a))

  // Try multiple Groww endpoints to find one with MTF avgPrice
  const growwToken = await resolveGrowwToken(session.user.id).catch(() => null)
  const pathResults: Record<string, unknown> = {}
  if (growwToken) {
    for (const path of GROWW_WEB_PATHS) {
      try {
        const res = await fetch(path, {
          headers: {
            Authorization: `Bearer ${growwToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })
        pathResults[path] = { status: res.status, body: res.ok ? await res.json().catch(() => null) : null }
      } catch (e) {
        pathResults[path] = { error: (e as Error).message }
      }
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
    hasToken: !!growwToken,
    pathResults,
    normalized,
    normalizedError,
  })
}
