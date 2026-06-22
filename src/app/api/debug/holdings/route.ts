import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBrokerAccounts } from '@/lib/broker'
import { safeDecrypt } from '@/lib/crypto'
import { getBrokerPortfolios } from '@/lib/services/portfolio'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accounts = await getBrokerAccounts(session.user.id)
  const accountDebug = accounts.map(a => ({
    brokerName: a.brokerName,
    isAdapterActive: a.isAdapterActive,
    hasClientCode: !!a.clientCode,
    hasJwtToken: !!a.jwtToken,
    hasExtraCredentials: !!a.extraCredentials,
    extraKeys: (() => {
      try {
        const raw = safeDecrypt(a.extraCredentials)
        return raw ? Object.keys(JSON.parse(raw)) : []
      } catch (e) { return [`error:${(e as Error).message}`] }
    })(),
  }))

  const errors: string[] = []
  let holdings: any[] = []

  // Patch settled to capture errors
  const origSettled = Promise.allSettled.bind(Promise)
  try {
    holdings = await getBrokerPortfolios(accounts)
  } catch (e) {
    errors.push((e as Error).message)
  }

  return NextResponse.json({
    accounts: accountDebug,
    holdingsCount: holdings.length,
    holdings: holdings.slice(0, 5),
    errors,
  })
}
