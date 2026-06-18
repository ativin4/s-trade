import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { mapPrismaToAppAccount } from '@/lib/broker'
import { brokerAdapter } from '@/lib/services/broker-adapter'

export interface OrderEntry {
  orderId: string
  symbol: string
  side: 'BUY' | 'SELL'
  qty: number
  price: number
  type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_MARKET' | string
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED' | string
  product: 'MIS' | 'CNC' | 'NRML' | string
  broker: string
  createdAt: string
}

function normaliseStatus(raw: string): OrderEntry['status'] {
  const s = (raw ?? '').toUpperCase()
  if (s.includes('COMPLETE') || s.includes('EXECUTED') || s.includes('FILLED')) return 'EXECUTED'
  if (s.includes('CANCEL')) return 'CANCELLED'
  if (s.includes('REJECT')) return 'REJECTED'
  return 'PENDING'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!brokerAdapter.available()) return NextResponse.json([])

  const accounts = await prisma.brokerAccount.findMany({
    where: { userId: session.user.id, isActive: true },
  })
  const syncedAccounts = accounts.filter(a => mapPrismaToAppAccount(a).isAdapterActive)
  if (!syncedAccounts.length) return NextResponse.json([])

  const results = await Promise.allSettled(
    syncedAccounts.map(async acc => {
      const raw = await brokerAdapter.orders()
      const list: any[] = raw?.order_list ?? []
      return list.map((o): OrderEntry => ({
        orderId:   o.order_id ?? o.groww_order_id ?? String(Math.random()),
        symbol:    o.trading_symbol ?? o.symbol ?? '',
        side:      (o.transaction_type ?? o.side ?? 'BUY').toUpperCase() as 'BUY' | 'SELL',
        qty:       Number(o.quantity ?? o.qty ?? 0),
        price:     Number(o.price ?? o.trigger_price ?? 0),
        type:      (o.order_type ?? o.type ?? 'MARKET').toUpperCase(),
        status:    normaliseStatus(o.order_status ?? o.status ?? ''),
        product:   (o.product ?? 'MIS').toUpperCase(),
        broker:    acc.brokerName,
        createdAt: o.order_timestamp ?? o.created_at ?? new Date().toISOString(),
      }))
    })
  )

  const orders = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return NextResponse.json(orders)
}
