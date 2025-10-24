'use client'

import { useState } from 'react'
import { TextField } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import SearchIcon from '@mui/icons-material/Search'

export function StockSearch() {
  const [symbol, setSymbol] = useState('')

  const handleSearch = () => {
    // TODO: Implement search logic
    console.log('Searching for:', symbol)
  }

  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <TextField
        type="text"
        placeholder="Enter stock symbol (e.g., RELIANCE.NS)"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      />
      <Button type="submit" onClick={handleSearch} startIcon={<SearchIcon />}>
        Search
      </Button>
    </div>
  )
}
