
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

interface WatchlistProps {
  userId: string
}

interface WatchlistItem {
  id: string
  symbol: string
  price: number
  change: number
  changePercent: number
}

export function Watchlist({ userId }: WatchlistProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [newSymbol, setNewSymbol] = useState('')

  useEffect(() => {
    // TODO: Fetch real watchlist data
    const mockWatchlist: WatchlistItem[] = [
      { id: '1', symbol: 'RELIANCE.NS', price: 2850.5, change: 10.2, changePercent: 0.36 },
      { id: '2', symbol: 'TCS.NS', price: 3800.0, change: -15.5, changePercent: -0.41 },
      { id: '3', symbol: 'HDFCBANK.NS', price: 1500.75, change: 5.1, changePercent: 0.34 },
    ]
    setWatchlist(mockWatchlist)
  }, [userId])

  const addSymbol = () => {
    if (newSymbol.trim() === '') return
    // TODO: Add symbol to watchlist via API
    const newItem: WatchlistItem = {
      id: (watchlist.length + 1).toString(),
      symbol: newSymbol.toUpperCase(),
      price: 0, // Fetch price on add
      change: 0,
      changePercent: 0,
    }
    setWatchlist([...watchlist, newItem])
    setNewSymbol('')
  }

  const removeSymbol = (id: string) => {
    // TODO: Remove symbol from watchlist via API
    setWatchlist(watchlist.filter(item => item.id !== id))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watchlist</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Input
            placeholder="Add symbol"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
          />
          <Button onClick={addSymbol} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ul className="space-y-2">
          {watchlist.map(item => (
            <li key={item.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{item.symbol}</p>
                <p className="text-sm text-muted-foreground">₹{item.price.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className={item.change >= 0 ? 'text-bull-500' : 'text-bear-500'}>
                  {item.change.toFixed(2)}
                </p>
                <p className={item.changePercent >= 0 ? 'text-bull-500' : 'text-bear-500'}>
                  {item.changePercent.toFixed(2)}%
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeSymbol(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
