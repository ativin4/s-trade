
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader} from '@/components/ui/card'
import Typography from '@mui/material/Typography'

interface MarketDepthProps {
  symbol: string
}

interface MarketDepthData {
  bids: { price: number; orders: number; quantity: number }[]
  asks: { price: number; orders: number; quantity: number }[]
}

export function MarketDepth({ symbol }: MarketDepthProps) {
  const [data, setData] = useState<MarketDepthData | null>(null)

  useEffect(() => {
    // TODO: Fetch real market depth data
    const mockData: MarketDepthData = {
      bids: [
        { price: 2850.5, orders: 10, quantity: 100 },
        { price: 2850.0, orders: 15, quantity: 200 },
        { price: 2849.5, orders: 12, quantity: 150 },
        { price: 2849.0, orders: 20, quantity: 300 },
        { price: 2848.5, orders: 18, quantity: 250 },
      ],
      asks: [
        { price: 2851.0, orders: 11, quantity: 120 },
        { price: 2851.5, orders: 14, quantity: 180 },
        { price: 2852.0, orders: 16, quantity: 220 },
        { price: 2852.5, orders: 9, quantity: 130 },
        { price: 2853.0, orders: 13, quantity: 170 },
      ],
    }
    setData(mockData)
  }, [symbol])

  return (
    <Card>
      <CardHeader>
        <Typography variant='h6'>Market Depth</Typography>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold text-bull-500 mb-2">Bids</h3>
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Orders</span>
                <span>Quantity</span>
                <span>Price</span>
              </div>
              {data?.bids.map((bid, i) => (
                <div key={i} className="flex justify-between">
                  <span>{bid.orders}</span>
                  <span>{bid.quantity}</span>
                  <span className="text-bull-500">{bid.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-bear-500 mb-2">Asks</h3>
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Price</span>
                <span>Quantity</span>
                <span>Orders</span>
              </div>
              {data?.asks.map((ask, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-bear-500">{ask.price.toFixed(2)}</span>
                  <span>{ask.quantity}</span>
                  <span>{ask.orders}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
