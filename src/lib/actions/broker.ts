'use server'

import { prisma } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { BrokerName } from '@/app/types'
import { getGrowwAccessToken } from '@/lib/services/groww'
import { getZerodhaAccessToken } from '@/lib/services/zerodha'
import { mapPrismaToAppAccount } from '@/lib/broker'
import { encrypt } from '@/lib/crypto'
import { GROWW_MCP_SENTINEL } from '@/lib/broker-constants'

export async function connectBroker(
  brokerName: BrokerName,
  credentials: {
    clientCode: string
    apiSecret?: string
    totpSecret?: string
    jwtToken?: string
    feedToken?: string
    extra?: Record<string, string | undefined> & { userId?: string; password?: string }
  }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Not authenticated')

  const existing = await prisma.brokerAccount.findFirst({
    where: { userId: session.user.id, brokerName },
    select: { id: true },
  })

  const isMcp = credentials.clientCode === GROWW_MCP_SENTINEL

  // Encrypt all sensitive fields before DB storage
  // MCP sentinel ('mcp://groww.in') is not a secret — store plaintext for easy sentinel checks
  const encClientCode = isMcp ? credentials.clientCode : encrypt(credentials.clientCode)
  const encApiSecret  = credentials.apiSecret  ? encrypt(credentials.apiSecret)  : null
  const encTotpSecret = credentials.totpSecret ? encrypt(credentials.totpSecret) : null

  // Auto-generate session token where possible
  let jwtToken: string | undefined
  if (!isMcp && brokerName === 'groww' && (credentials.totpSecret || credentials.apiSecret)) {
    const fakeAccount = {
      id: '', userId: session.user.id, brokerName,
      clientCode: credentials.clientCode,
      apiSecret:  credentials.apiSecret  ?? null,
      totpSecret: credentials.totpSecret ?? null,
      jwtToken: null, feedToken: null, isActive: true,
      lastSync: new Date(), createdAt: new Date(), updatedAt: new Date(),
      portfolio: [],
    }
    try {
      jwtToken = await getGrowwAccessToken(mapPrismaToAppAccount(fakeAccount))
    } catch (err) {
      throw new Error(`Groww auth failed: ${(err as Error).message}`)
    }
  }

  if (brokerName === 'zerodha' && credentials.totpSecret && credentials.apiSecret && credentials.extra?.userId && credentials.extra?.password) {
    try {
      jwtToken = await getZerodhaAccessToken(
        credentials.clientCode,
        credentials.apiSecret,
        credentials.extra.userId,
        credentials.extra.password,
        credentials.totpSecret,
      )
    } catch (err) {
      throw new Error(`Zerodha auth failed: ${(err as Error).message}`)
    }
  }

  // Auto-generated token takes priority; otherwise use manually supplied value
  const encJwt  = jwtToken ? encrypt(jwtToken) : (credentials.jwtToken ? encrypt(credentials.jwtToken) : undefined)
  const encFeed = credentials.feedToken ? encrypt(credentials.feedToken) : undefined

  // Overflow secrets that don't fit the named columns (e.g. 5paisa's User Key/Client Code/TOTP/PIN), stored as encrypted JSON
  const extraEntries = Object.entries(credentials.extra ?? {}).filter(([, v]) => v)
  const encExtra = extraEntries.length ? encrypt(JSON.stringify(Object.fromEntries(extraEntries))) : undefined

  const brokerAccount = await prisma.brokerAccount.upsert({
    where: { id: existing?.id ?? '' },
    update: {
      clientCode: encClientCode,
      apiSecret:  encApiSecret,
      totpSecret: encTotpSecret,
      isActive: true,
      ...(encJwt   ? { jwtToken:  encJwt   } : {}),
      ...(encFeed  ? { feedToken: encFeed  } : {}),
      ...(encExtra ? { extraCredentials: encExtra } : {}),
    },
    create: {
      userId: session.user.id,
      brokerName,
      clientCode: encClientCode,
      apiSecret:  encApiSecret,
      totpSecret: encTotpSecret,
      isActive: true,
      ...(encJwt   ? { jwtToken:  encJwt   } : {}),
      ...(encFeed  ? { feedToken: encFeed  } : {}),
      ...(encExtra ? { extraCredentials: encExtra } : {}),
    },
  })

  return brokerAccount
}

export async function disconnectBroker(brokerAccountId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Not authenticated')

  await prisma.brokerAccount.update({
    where: { id: brokerAccountId, userId: session.user.id },
    data: { isActive: false },
  })
}

export async function storeBrokerToken(
  brokerAccountId: string,
  jwtToken: string,
  feedToken?: string
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Not authenticated')

  // Verify this account belongs to the caller before writing
  const account = await prisma.brokerAccount.findFirst({
    where: { id: brokerAccountId, userId: session.user.id },
    select: { id: true },
  })
  if (!account) throw new Error('Account not found')

  await prisma.brokerAccount.update({
    where: { id: brokerAccountId },
    data: {
      jwtToken:  encrypt(jwtToken),
      feedToken: feedToken ? encrypt(feedToken) : null,
    },
  })
}

export async function refreshGrowwToken(brokerAccountId: string): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Not authenticated')

  const account = await prisma.brokerAccount.findFirst({
    where: { id: brokerAccountId, userId: session.user.id },
  })
  if (!account) throw new Error('Account not found')
  if (!account.totpSecret && !account.apiSecret) throw new Error('No credentials to refresh token')

  const mapped = mapPrismaToAppAccount(account)
  const token = await getGrowwAccessToken(mapped)

  await prisma.brokerAccount.update({
    where: { id: brokerAccountId },
    data: { jwtToken: encrypt(token) },
  })
  return token
}
