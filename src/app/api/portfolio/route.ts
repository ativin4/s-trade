import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { mapPrismaToAppAccount } from '@/lib/broker'
import { getBrokerPortfolios, getPortfolioPerformance } from '@/lib/services/portfolio'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accounts = await prisma.brokerAccount.findMany({
    where: { userId: session.user.id, isActive: true },
  })

  const mapped = accounts.map(mapPrismaToAppAccount)
  const { holdings } = await getBrokerPortfolios(mapped)
  const performance = await getPortfolioPerformance(holdings)

  return NextResponse.json({ holdings, performance })
}
