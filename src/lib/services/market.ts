import type { MarketData } from "@/app/types";

import { getKiteMarketData, getUpstoxMarketData } from "@/lib/market-data";

export async function getMarketData(): Promise<MarketData> {
  try {
    return await getKiteMarketData();
  } catch (error) {
    console.error("Failed to fetch market data from Kite, trying Upstox:", error);
    return await getUpstoxMarketData();
  }
}


export async function getNews(): Promise<Array<{ title: string; url: string; source: string; sentiment: string }>> {
  // Mock data - replace with actual API call
  return [
    { title: 'Reliance Industries to invest $10 billion in renewable energy', url: '#', source: 'Livemint', sentiment: 'Positive' },
    { title: 'Infosys partners with Microsoft for a new cloud-based solution', url: '#', source: 'The Economic Times', sentiment: 'Positive' },
    { title: 'Tata Motors reports a 15% increase in sales for the last quarter', url: '#', source: 'Business Standard', sentiment: 'Positive' },
    { title: 'Government to announce new measures to control inflation', url: '#', source: 'Reuters', sentiment: 'Neutral' },
    { title: 'Global cues and rising oil prices may impact the market this week', url: '#', source: 'Moneycontrol', sentiment: 'Negative' },
  ]
}
