'use client'

import { useState } from 'react'
import { TextField } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import SearchIcon from '@mui/icons-material/Search'

interface StockSearchProps {
  onSelect?: (symbol: string) => void
}

export function StockSearch({ onSelect }: StockSearchProps) {
  const [symbol, setSymbol] = useState('')

  const handleSearch = () => {
    const s = symbol.trim().toUpperCase().replace('.NS', '').replace('.BO', '')
    if (s) onSelect?.(s)
  }

  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <TextField
        type="text"
        placeholder="RELIANCE, TCS, HDFCBANK…"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      />
      <Button type="button" onClick={handleSearch} startIcon={<SearchIcon />}>
        Load Chart
      </Button>
    </div>
  )
}
