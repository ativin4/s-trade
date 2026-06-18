import { PrismaClient } from "@prisma/client";
import type { UserSettings as AppUserSettings, RiskTolerance, MarketCap, OTPMethod } from "@/app/types";

const prisma = new PrismaClient();

/**
 * Transforms the Prisma ORM result (database model) into a domain-level application model.
 * This uses an explicit mapper to ensure schema+type compatibility across layers.
 */
export function mapPrismaToAppSettings(settings: {
  id: string;
  userId: string;
  maxBudgetPerTrade?: number | null;
  riskTolerance?: string | null;
  autoTradingEnabled?: boolean | null;
  excludedSectors?: string[];
  preferredMarketCap?: string | null;
  otpMethod?: string | null;
} | null): AppUserSettings | null {
  return settings ? {
    id: settings.id,
    userId: settings.userId,
    maxBudgetPerTrade: settings.maxBudgetPerTrade ?? 10000,
    riskTolerance: (settings.riskTolerance as RiskTolerance) ?? 'MODERATE',
    autoTradingEnabled: settings.autoTradingEnabled ?? false,
    excludedSectors: settings.excludedSectors ?? [],
    preferredMarketCap: (settings.preferredMarketCap as MarketCap) ?? 'MULTI_CAP',
    otpMethod: (settings.otpMethod as OTPMethod) ?? 'EMAIL',
    createdAt: new Date(),
    updatedAt: new Date(),
  } : null;
}



/**
 * ORM method – retrieves user settings and maps them to application types
 */
export async function getUserSettings(userId: string): Promise<AppUserSettings | null> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) return null;

  return mapPrismaToAppSettings(settings);
}

/** const prisma = new PrismaClient().$extends({
  model: {
    userSettings: {
      async getAppSettings(userId: string) {
        const settings = await prisma.userSettings.findUnique({ where: { userId } });
        return settings ? mapPrismaToAppSettings(settings) : null;
      },
    },
  },
});

// Usage
const userSettings = await prisma.userSettings.getAppSettings(userId);
 */