import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/auth'
import { mapPrismaToAppAccount } from '@/lib/broker'
import { encrypt, safeDecrypt } from '@/lib/crypto'
import { getGrowwAccessToken } from '@/lib/services/groww'
import { loginWithTotp } from '@/lib/services/5paisa'

// Vercel Cron sends Authorization: Bearer {CRON_SECRET}
function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  return secret && req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.brokerAccount.findMany({
    where: { isActive: true },
    select: {
      id: true, userId: true, brokerName: true, isActive: true, isAdapterActive: true,
      clientCode: true, apiSecret: true, totpSecret: true, jwtToken: true,
      feedToken: true, refreshToken: true, extraCredentials: true,
    },
  })

  const results = await Promise.allSettled(rows.map(async (row) => {
    const acc = mapPrismaToAppAccount(row)

    if (acc.brokerName === 'groww') {
      const token = await getGrowwAccessToken(acc)
      await prisma.brokerAccount.update({ where: { id: acc.id }, data: { jwtToken: encrypt(token) } })
      return `groww:${acc.id.slice(-4)} ok`
    }

    if (acc.brokerName === '5paisa') {
      const rawExtra = safeDecrypt(acc.extraCredentials)
      if (!rawExtra) return `5paisa:${acc.id.slice(-4)} skip (no creds)`
      const extra = JSON.parse(rawExtra) as Record<string, string>
      const token = await loginWithTotp({
        userKey:        extra.userKey        ?? '',
        realClientCode: extra.realClientCode ?? '',
        realTotpSecret: extra.realTotpSecret,
        accessToken:    extra.accessToken,
        appName:        safeDecrypt(acc.totpSecret) ?? '',
        userId:         safeDecrypt(acc.clientCode) ?? '',
        password:       safeDecrypt(acc.apiSecret)  ?? '',
        encryptionKey:  safeDecrypt(acc.feedToken)  ?? '',
        source:         safeDecrypt(acc.jwtToken)   ?? '',
      })
      await prisma.brokerAccount.update({ where: { id: acc.id }, data: { jwtToken: encrypt(token) } })
      return `5paisa:${acc.id.slice(-4)} ok`
    }

    return `${acc.brokerName}:${acc.id.slice(-4)} skip`
  }))

  const summary = results.map(r => r.status === 'fulfilled' ? r.value : `error: ${(r.reason as Error)?.message}`)
  return NextResponse.json({ summary, at: new Date().toISOString() })
}
