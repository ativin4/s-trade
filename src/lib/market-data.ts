import { ExternalAPIError, type MarketData } from "@/app/types";

const UPSTOX_API_URL = "/api/proxy/stock-data";
const KITE_API_URL = "/api/proxy/stock-data";

export async function getKiteMarketData(): Promise<MarketData> {
  try {
    const response = await fetch(`${KITE_API_URL}/market/indices`);

    if (!response.ok) {
      throw new ExternalAPIError(
        `Failed to fetch market data from Kite: ${response.statusText}`,
        "zerodha"
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ExternalAPIError) {
      throw error;
    }
    throw new ExternalAPIError(
      `Failed to fetch market data from Kite: ${(error as Error).message}`,
      "zerodha"
    );
  }
}

export async function getUpstoxMarketData(): Promise<MarketData> {
  try {
    const response = await fetch(`${UPSTOX_API_URL}/market/indices`);

    if (!response.ok) {
      throw new ExternalAPIError(
        `Failed to fetch market data from Upstox: ${response.statusText}`,
        "groww" // Assuming upstox is used for groww
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ExternalAPIError) {
      throw error;
    }
    throw new ExternalAPIError(
      `Failed to fetch market data from Upstox: ${(error as Error).message}`,
      "groww" // Assuming upstox is used for groww
    );
  }
}