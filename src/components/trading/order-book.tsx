
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OrderBookProps {
  symbol: string
}

interface OrderBookData {
  bids: { price: number; quantity: number }[]
  asks: { price: number; quantity: number }[]
}

export function OrderBook({ symbol }: OrderBookProps) {
  const [data, setData] = useState<OrderBookData | null>(null)

  useEffect(() => {
    // TODO: Fetch real order book data
    const mockData: OrderBookData = {
      bids: [
        { price: 2850.5, quantity: 100 },
        { price: 2850.0, quantity: 200 },
        { price: 2849.5, quantity: 150 },
        { price: 2849.0, quantity: 300 },
        { price: 2848.5, quantity: 250 },
      ],
      asks: [
        { price: 2851.0, quantity: 120 },
        { price: 2851.5, quantity: 180 },
        { price: 2852.0, quantity: 220 },
        { price: 2852.5, quantity: 130 },
        { price: 2853.0, quantity: 170 },
      ],
    }
    setData(mockData)
  }, [symbol])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Book</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold text-bull-500 mb-2">Bids</h3>
            <div className="space-y-1">
              {data?.bids.map((bid, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-bull-500">{bid.price.toFixed(2)}</span>
                  <span>{bid.quantity}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-bear-500 mb-2">Asks</h3>
            <div className="space-y-1">
              {data?.asks.map((ask, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-bear-500">{ask.price.toFixed(2)}</span>
                  <span>{ask.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
