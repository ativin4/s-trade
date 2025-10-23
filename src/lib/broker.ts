import type { BrokerAccount as PrismaBrokerAccount } from '@/app/generated/prisma-client';
import type { BrokerAccount as AppBrokerAccount, BrokerName } from '../../types-global';

import { prisma } from '@/lib/auth'

export async function getBrokerAccounts(userId: string) {
  return await prisma.brokerAccount.findMany({
    where: { userId, isActive: true },
  });
}

export function mapPrismaBrokerAccountToApp(account: PrismaBrokerAccount): AppBrokerAccount {
    // WARNING: This is a temporary solution due to a data model inconsistency.
    // The 'BrokerAccount' model in the database (Prisma) is missing fields
    // expected by the application's 'BrokerAccount' type ('types-global.ts').
    // Default or dummy values are being used for the missing properties.
    return {
        id: account.id,
        userId: account.userId,
        brokerName: account.brokerName as BrokerName,
        isActive: account.isActive,
        // Dummy values for fields missing from the database model:
        accountId: 'DUMMY_ACCOUNT_ID',
        apiKey: 'DUMMY_API_KEY',
        apiSecret: 'DUMMY_API_SECRET',
        accessToken: 'DUMMY_ACCESS_TOKEN',
        balance: 100000, // DUMMY
        createdAt: new Date(), // DUMMY
        updatedAt: new Date(), // DUMMY
    };
}
