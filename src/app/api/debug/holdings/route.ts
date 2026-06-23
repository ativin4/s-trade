import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBrokerAccounts } from '@/lib/broker'
import { safeDecrypt } from '@/lib/crypto'
import { getFivePaisaHoldings } from '@/lib/services/5paisa'
import { getGrowwHoldings } from '@/lib/services/groww'
import { isGrowwMcp } from '@/lib/broker-constants'
import { brokerAdapter } from '@/lib/services/broker-adapter'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accounts = await getBrokerAccounts(session.user.id)
  const results: Record<string, any> = {}

  for (const acc of accounts) {
    const extra = (() => {
      try {
        const raw = safeDecrypt(acc.extraCredentials)
        return raw ? JSON.parse(raw) : null
      } catch { return null }
    })()

    const info: any = {
      brokerName: acc.brokerName,
      hasClientCode: !!acc.clientCode,
      hasApiSecret: !!acc.apiSecret,
      hasTotpSecret: !!acc.totpSecret,
      hasJwtToken: !!acc.jwtToken,
      hasFeedToken: !!acc.feedToken,
      hasExtraCredentials: !!acc.extraCredentials,
      extraKeys: extra ? Object.keys(extra) : [],
    }

    try {
      if (acc.brokerName === '5paisa') {
        info.holdings = await getFivePaisaHoldings(acc)
        info.holdingsCount = info.holdings.length
      } else if (acc.brokerName === 'groww' && !isGrowwMcp(acc)) {
        info.holdings = await getGrowwHoldings(acc)
        info.holdingsCount = info.holdings.length
      }
      info.status = 'ok'
    } catch (e) {
      info.status = 'error'
      info.error = (e as Error).message
    }

    try {
      if (acc.isAdapterActive) {
        info.adapterHoldings = await brokerAdapter.holdings(acc.brokerName.toLowerCase())
        info.adapterHoldingsCount = info.adapterHoldings.length
        info.adapterStatus = 'ok'
      }
    } catch (e) {
      info.adapterStatus = 'error'
      info.adapterError = (e as Error).message
    }

    results[acc.brokerName + '_' + acc.id.slice(-4)] = info
  }

  return NextResponse.json(results)
}
