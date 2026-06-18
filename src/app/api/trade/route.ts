import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, prisma } from '@/lib/auth'
import { mapPrismaToAppAccount, isGrowwMcp } from '@/lib/broker'
import { placeGrowwOrder, cancelGrowwOrder } from '@/lib/services/groww'
import { brokerAdapter } from '@/lib/services/broker-adapter'

function paperOrderId() {
  return `PAPER-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    brokerAccountId,
    trading_symbol,
    quantity,
    price,
    trigger_price,
    validity = 'DAY',
    exchange = 'NSE',
    segment = 'CASH',
    product = 'CNC',
    order_type,
    transaction_type,
  } = body

  if (!brokerAccountId || !trading_symbol || !quantity || !order_type || !transaction_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const prismaAccount = await prisma.brokerAccount.findFirst({
    where: { id: brokerAccountId, userId: session.user.id, isActive: true },
  })
  if (!prismaAccount) return NextResponse.json({ error: 'Broker account not found' }, { status: 404 })

  const account = mapPrismaToAppAccount(prismaAccount)

  const isMcpOnly = isGrowwMcp(account) || !['groww'].includes(account.brokerName)

  let orderId: string
  let isPaper = false

  // 1. Oracle VM adapter (static IP, real order)
  if (brokerAdapter.available()) {
    try {
      const result = await brokerAdapter.placeOrder({
        symbol: trading_symbol,
        qty: quantity,
        side: transaction_type as 'BUY' | 'SELL',
        orderType: order_type as 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_MARKET',
        product: product as 'CNC' | 'MIS',
        price: price ?? 0,
        triggerPrice: trigger_price ?? 0,
        exchange,
      })
      orderId = result.groww_order_id
    } catch {
      isPaper = true
      orderId = paperOrderId()
    }
  } else if (!isMcpOnly) {
    // 2. Direct broker API (needs per-account creds)
    try {
      const result = await placeGrowwOrder(account, {
        trading_symbol, quantity, price, trigger_price,
        validity, exchange, segment, product, order_type, transaction_type,
      })
      orderId = result.groww_order_id
    } catch {
      isPaper = true
      orderId = paperOrderId()
    }
  } else {
    isPaper = true
    orderId = paperOrderId()
  }

  await prisma.trade.create({
    data: {
      userId: session.user.id,
      brokerAccountId,
      symbol: trading_symbol,
      tradeType: transaction_type,
      orderType: order_type,
      status: isPaper ? 'PAPER' : 'PENDING',
      quantity,
      price: price ?? 0,
    },
  })

  return NextResponse.json({ success: true, orderId, paper: isPaper })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { brokerAccountId, orderId, segment = 'CASH' } = await req.json()

  if (String(orderId).startsWith('PAPER-')) {
    return NextResponse.json({ success: true, paper: true })
  }

  // 1. Oracle VM adapter
  if (brokerAdapter.available()) {
    try {
      await brokerAdapter.cancelOrder(orderId)
      return NextResponse.json({ success: true })
    } catch { /* fall through to direct */ }
  }

  // 2. Direct broker
  const prismaAccount = await prisma.brokerAccount.findFirst({
    where: { id: brokerAccountId, userId: session.user.id, isActive: true },
  })
  if (!prismaAccount) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const account = mapPrismaToAppAccount(prismaAccount)

  try {
    if (account.brokerName === 'groww') {
      await cancelGrowwOrder(account, orderId, segment)
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
