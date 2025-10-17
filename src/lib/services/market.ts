import type { MarketData } from "@/app/types";

export async function getMarketData(): Promise<MarketData> {
  // In a real app, you would fetch this from a market data provider API.
  // For now, we return mock data.
  return {
    nifty50: {
      value: 18500,
      change: 100,
      changePercent: 0.54,
      high: 18550,
      low: 18450,
      volume: 1000000,
    },
    sensex: {
      value: 62000,
      change: 200,
      changePercent: 0.32,
      high: 62100,
      low: 61900,
      volume: 500000,
    },
    bankNifty: {
      value: 43000,
      change: -100,
      changePercent: -0.23,
      high: 43100,
      low: 42900,
      volume: 800000,
    },
    itIndex: {
      value: 35000,
      change: 150,
      changePercent: 0.43,
      high: 35100,
      low: 34900,
      volume: 600000,
    },
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
