
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { Order } from '@/types'

interface ActiveOrdersProps {
  userId: string
}

export function ActiveOrders({ userId }: ActiveOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    // TODO: Fetch real active orders data
    const mockOrders: Order[] = [
      {
        id: '1',
        symbol: 'RELIANCE.NS',
        type: 'LIMIT',
        side: 'BUY',
        quantity: 10,
        price: 2850.0,
        status: 'OPEN',
        createdAt: new Date(),
      },
      {
        id: '2',
        symbol: 'TCS.NS',
        type: 'LIMIT',
        side: 'SELL',
        quantity: 5,
        price: 3850.0,
        status: 'OPEN',
        createdAt: new Date(),
      },
    ]
    setOrders(mockOrders)
  }, [userId])

  const cancelOrder = (id: string) => {
    // TODO: Implement order cancellation
    console.log('Cancel order:', id)
    setOrders(orders.filter(order => order.id !== id))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => (
              <TableRow key={order.id}>
                <TableCell>{order.symbol}</TableCell>
                <TableCell>
                  <Badge variant={order.side === 'BUY' ? 'default' : 'destructive'}>
                    {order.side}
                  </Badge>
                </TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>₹{order.price.toLocaleString('en-IN')}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => cancelOrder(order.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
