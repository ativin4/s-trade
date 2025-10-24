'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader} from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
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
        <Typography variant='h6'>Active Orders</Typography>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Side</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Price</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map(order => (
              <TableRow key={order.id}>
                <TableCell>{order.symbol}</TableCell>
                <TableCell>
                  <Badge variant={order.side === 'BUY' ? 'default' : 'destructive'} label={order.side} />
                </TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>₹{order.price.toLocaleString('en-IN')}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => cancelOrder(order.id)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}