import type { UserSettings as PrismaUserSettings } from '@/app/generated/prisma-client';
import type { UserSettings as AppUserSettings, RiskTolerance, MarketCap, OTPMethod } from '../../types-global';

export function mapPrismaSettingsToApp(settings: PrismaUserSettings | null): AppUserSettings | null {
    if (!settings) {
        return null;
    }

    // WARNING: This is a temporary solution due to a data model inconsistency.
    // The 'UserSettings' model in the database (Prisma) is missing fields
    // expected by the application's 'UserSettings' type ('types-global.ts').
    // Default or dummy values are being used for the missing properties.
    return {
        id: settings.id,
        userId: settings.userId,
        riskTolerance: (settings.riskTolerance as RiskTolerance) || 'MODERATE',
        maxBudgetPerTrade: 10000, // DUMMY: Field missing from database model
        autoTradingEnabled: false, // DUMMY: Field missing from database model
        excludedSectors: [], // DUMMY: Field missing from database model
        preferredMarketCap: 'MULTI_CAP', // DUMMY: Field missing from database model
        otpMethod: 'EMAIL', // DUMMY: Field missing from database model
        createdAt: new Date(), // DUMMY: Field missing from database model
        updatedAt: new Date(), // DUMMY: Field missing from database model
    };
}
