'use server'

import { prisma } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { OTPMethod, RiskTolerance, MarketCap } from '@/app/types'

export async function saveUserSettings(data: {
  otpMethod?: OTPMethod
  maxBudgetPerTrade?: number
  riskTolerance?: RiskTolerance
  autoTradingEnabled?: boolean
  excludedSectors?: string[]
  preferredMarketCap?: MarketCap
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Not authenticated')

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  })

  return settings
}
