import { PrismaClient } from "@prisma/client";
import type { BrokerAccount as AppBrokerAccount, BrokerName } from "@/types";

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
}): AppBrokerAccount {
  return {
    id: account.id,
    userId: account.userId,
    brokerName: account.brokerName as BrokerName,
    isActive: account.isActive,

    // Fields not persisted in DB, filled by logic/service layer:
    accountId: `ACCOUNT_${account.id}`,
    apiKey: process.env.DUMMY_API_KEY ?? "PLACEHOLDER_KEY",
    apiSecret: process.env.DUMMY_API_SECRET ?? "PLACEHOLDER_SECRET",
    accessToken: "TEMP_ACCESS_TOKEN",
    balance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}


/**
 * Fetch all active broker accounts for the given user.
 * Prisma ORM query follows SQL semantics and returns typed results.
 */
export async function getBrokerAccounts(userId: string): Promise<AppBrokerAccount[]> {
  const accounts = await prisma.brokerAccount.findMany({
    where: { userId, isActive: true },
  });

  // Map to application's domain model
  return accounts.map(mapPrismaToAppAccount);
}

