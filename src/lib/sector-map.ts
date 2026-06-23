export const SECTOR_MAP: Record<string, string> = {
  RELIANCE: 'Energy', TCS: 'IT', HDFCBANK: 'Banking', ICICIBANK: 'Banking',
  INFOSYS: 'IT', BHARTIARTL: 'Telecom', SBIN: 'Banking', LT: 'Infra',
  HINDUNILVR: 'FMCG', HCLTECH: 'IT', AXISBANK: 'Banking', BAJFINANCE: 'NBFC',
  KOTAKBANK: 'Banking', WIPRO: 'IT', NTPC: 'Power', ONGC: 'Energy',
  TATAMOTORS: 'Auto', MARUTI: 'Auto', TITAN: 'Consumer', ITC: 'FMCG',
  ADANIENT: 'Infra', ADANIPORTS: 'Infra', SUNPHARMA: 'Pharma', TECHM: 'IT',
  TATASTEEL: 'Metals', INFY: 'IT', HDFC: 'Banking', BAJAJFINSV: 'NBFC',
  ASIANPAINT: 'Consumer', ULTRACEMCO: 'Cement',
}

export function getSector(symbol: string): string {
  return SECTOR_MAP[symbol.replace('-EQ', '').replace('.NS', '')] ?? 'Other'
}
