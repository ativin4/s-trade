import type { BrokerAccount, PortfolioHolding } from '@/app/types'
import { safeDecrypt } from '@/lib/crypto'
import { ExternalAPIError } from '@/app/types'
import type { PositionEntry } from '@/app/api/market/positions/route'

const BASE = 'https://Openapi.5paisa.com/VendorFeeds/api'

interface FivePaisaCreds {
  accessToken: string
  userKey: string
  appName: string
  realClientCode: string
}

function extractCreds(account: BrokerAccount): FivePaisaCreds | null {
  const rawExtra = safeDecrypt(account.extraCredentials)
  if (!rawExtra) return null
  let extra: Record<string, string> = {}
  try { extra = JSON.parse(rawExtra) } catch { return null }

  const accessToken    = extra.accessToken    || ''
  const userKey        = extra.userKey        || ''
  const realClientCode = extra.realClientCode || safeDecrypt(account.clientCode) || ''
  const appName        = safeDecrypt(account.totpSecret) || extra.appName || ''

  if (!accessToken || !userKey || !realClientCode) return null
  return { accessToken, userKey, appName, realClientCode }
}

function fivePaisaHeaders(accessToken: string) {
  return {
    Authorization: `bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

function requestHead(requestCode: string, userKey: string, appName: string) {
  return { requestCode, key: userKey, appName, appVer: '1.0', userId: 'PQ' }
}

export async function getFivePaisaHoldings(account: BrokerAccount): Promise<PortfolioHolding[]> {
  const creds = extractCreds(account)
  if (!creds) throw new ExternalAPIError('Missing 5paisa credentials (accessToken, userKey, clientCode required)', '5paisa')

  const res = await fetch(`${BASE}/Account/Holdings`, {
    method: 'POST',
    headers: fivePaisaHeaders(creds.accessToken),
    body: JSON.stringify({
      head: requestHead('5PHoldings', creds.userKey, creds.appName),
      body: { ClientCode: creds.realClientCode },
    }),
  })
  if (!res.ok) throw new ExternalAPIError(`5paisa holdings ${res.status}: ${res.statusText}`, '5paisa')

  const json = await res.json()
  const status = json?.head?.status ?? json?.body?.Status
  if (status !== '0' && status !== 0) {
    throw new ExternalAPIError(`5paisa holdings error: ${json?.head?.statusDescription ?? json?.body?.Message ?? status}`, '5paisa')
  }

  const items: any[] = json?.body?.Data ?? []
  return items.map((h): PortfolioHolding => {
    const qty       = h.Qty ?? 0
    const avgPrice  = h.AvgRate ?? 0
    const ltp       = h.LTP ?? 0
    const invested  = avgPrice * qty
    const pnl       = h.ProfitAndLoss ?? (ltp - avgPrice) * qty
    return {
      symbol:           h.Symbol ?? '',
      name:             h.Symbol ?? '',
      quantity:         qty,
      avgPrice,
      currentPrice:     ltp,
      marketValue:      h.CurrentValue ?? ltp * qty,
      gainLoss:         pnl,
      gainLossPercent:  invested > 0 ? (pnl / invested) * 100 : 0,
      change:           0,
      changePercent:    h.PChange ?? 0,
      aiRecommendation: 'HOLD' as const,
      confidence:       0,
      insight:          '',
      brokerAccountId:  account.id,
    }
  })
}

export async function getFivePaisaPositions(account: BrokerAccount): Promise<PositionEntry[]> {
  const creds = extractCreds(account)
  if (!creds) throw new ExternalAPIError('Missing 5paisa credentials', '5paisa')

  const res = await fetch(`${BASE}/Account/NetPositionNetWise`, {
    method: 'POST',
    headers: fivePaisaHeaders(creds.accessToken),
    body: JSON.stringify({
      head: requestHead('5PNetPositionNetWise', creds.userKey, creds.appName),
      body: { ClientCode: creds.realClientCode },
    }),
  })
  if (!res.ok) throw new ExternalAPIError(`5paisa positions ${res.status}: ${res.statusText}`, '5paisa')

  const json = await res.json()
  const items: any[] = json?.body?.NetPositionDetail ?? []

  return items
    .filter(p => (p.NetQty ?? 0) !== 0 || (p.MTOM ?? 0) !== 0)
    .map((p): PositionEntry => {
      const netQty   = Math.abs(p.NetQty ?? 0)
      const avgPrice = p.BuyAvgRate ?? p.SellAvgRate ?? 0
      const ltp      = p.LTP ?? 0
      const mtom     = p.MTOM ?? 0
      const side     = (p.BuySellInd === 'S' ? 'SELL' : 'BUY') as 'BUY' | 'SELL'
      // ProductType: 'I'=intraday, 'D'=delivery, 'F'=futures, 'O'=options
      const productMap: Record<string, string> = { I: 'MIS', D: 'CNC', F: 'NRML', O: 'NRML' }
      const product = (productMap[p.ProductType] ?? p.ProductType ?? 'MIS') as PositionEntry['product']
      return {
        symbol:        p.ScripName ?? '',
        qty:           netQty,
        avgPrice,
        ltp,
        pnl:           mtom,
        pnlPercent:    avgPrice > 0 && netQty > 0 ? (mtom / (avgPrice * netQty)) * 100 : 0,
        product,
        side,
        broker:        '5paisa',
        realisedPnl:   p.BookedPL ?? 0,
        unrealisedPnl: mtom,
      }
    })
}
