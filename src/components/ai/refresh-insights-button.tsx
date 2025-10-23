'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

export function RefreshInsightsButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleClick = async () => {
    setIsRefreshing(true)
    // TODO: Implement refresh logic
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRefreshing(false)
  }

  return (
    <Button onClick={handleClick} disabled={isRefreshing}>
      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh Insights'}
    </Button>
  )
}