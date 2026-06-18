export const GROWW_MCP_SENTINEL = 'mcp://groww.in'
export const isGrowwMcp = (account: { clientCode?: string | null }) =>
  account.clientCode === GROWW_MCP_SENTINEL

export const PRODUCT = {
  MIS:  'MIS',   // intraday
  CNC:  'CNC',   // delivery
  NRML: 'NRML',  // F&O
  MTF:  'MTF',   // margin trading facility
} as const
export type Product = typeof PRODUCT[keyof typeof PRODUCT]

export const SIDE = { BUY: 'BUY', SELL: 'SELL' } as const
export type Side = typeof SIDE[keyof typeof SIDE]

export const ORDER_STATUS = {
  EXECUTED:  'EXECUTED',
  PENDING:   'PENDING',
  CANCELLED: 'CANCELLED',
  REJECTED:  'REJECTED',
} as const
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

export const PRODUCT_LABEL: Record<string, string> = {
  [PRODUCT.MIS]:  'Intraday',
  [PRODUCT.CNC]:  'Delivery',
  [PRODUCT.NRML]: 'F&O',
  [PRODUCT.MTF]:  'MTF',
}
