import { PrismaClient } from "@prisma/client";
import type { BrokerAccount as AppBrokerAccount, BrokerName } from "@/app/types";

export { GROWW_MCP_SENTINEL, isGrowwMcp } from '@/lib/broker-constants'

const prisma = new PrismaClient();
/**
 * ORM mapper function to transform the Prisma model
 * into the domain‑specific application model.
 * This keeps your Prisma layer isolated from view/data layers.
 */
export function mapPrismaToAppAccount(account: {
  id: string;
  userId: string;
  brokerName: string;
  isActive: boolean;
  isAdapterActive?: boolean;
  clientCode?: string | null;
  apiSecret?: string | null;
  totpSecret?: string | null;
  jwtToken?: string | null;
  feedToken?: string | null;
  refreshToken?: string | null;
  extraCredentials?: string | null;
}): AppBrokerAccount {
  return {
    id: account.id,
    userId: account.userId,
    brokerName: account.brokerName as BrokerName,
    isActive: account.isActive,
    isAdapterActive: account.isAdapterActive ?? false,
    clientCode: account.clientCode ?? null,
    apiSecret: account.apiSecret ?? null,
    totpSecret: account.totpSecret ?? null,
    jwtToken: account.jwtToken ?? null,
    feedToken: account.feedToken ?? null,
    refreshToken: account.refreshToken ?? null,
    extraCredentials: account.extraCredentials ?? null,
  };
}


/**
 * Fetch all active broker accounts for the given user.
 * Prisma ORM query follows SQL semantics and returns typed results.
 */
export async function getBrokerAccounts(userId: string): Promise<AppBrokerAccount[]> {
  const accounts = await prisma.brokerAccount.findMany({
    where: { userId, isActive: true },
    select: {
      id: true, userId: true, brokerName: true, isActive: true, isAdapterActive: true,
      clientCode: true, apiSecret: true, totpSecret: true, jwtToken: true,
      feedToken: true, refreshToken: true, extraCredentials: true,
    },
  });
  return accounts.map(mapPrismaToAppAccount);
}

