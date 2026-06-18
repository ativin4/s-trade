import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    maxBudgetPerTrade,
    riskTolerance,
    autoTradingEnabled,
    excludedSectors,
    preferredMarketCap,
    otpMethod,
  } = body

  const data: Record<string, unknown> = {}
  if (maxBudgetPerTrade  !== undefined) data.maxBudgetPerTrade  = Number(maxBudgetPerTrade)
  if (riskTolerance      !== undefined) data.riskTolerance      = riskTolerance
  if (autoTradingEnabled !== undefined) data.autoTradingEnabled = Boolean(autoTradingEnabled)
  if (excludedSectors    !== undefined) data.excludedSectors    = excludedSectors
  if (preferredMarketCap !== undefined) data.preferredMarketCap = preferredMarketCap
  if (otpMethod          !== undefined) data.otpMethod          = otpMethod

  const settings = await prisma.userSettings.upsert({
    where:  { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  })

  return NextResponse.json({ success: true, settings })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } })
  return NextResponse.json(settings ?? {})
}
