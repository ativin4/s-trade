import type { BrokerAccount } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface PortfolioSyncStatusProps {
  brokerAccounts: BrokerAccount[]
}

export function PortfolioSyncStatus({ brokerAccounts }: PortfolioSyncStatusProps) {
  const lastSynced = brokerAccounts.length > 0 ? new Date(Math.max(...brokerAccounts.map(acc => new Date(acc.lastSync).getTime()))) : null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Portfolio Sync</CardTitle>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync Now
        </Button>
      </CardHeader>
      <CardContent>
        {
          lastSynced ? (
            <p className="text-sm text-muted-foreground">
              Last synced: {lastSynced.toLocaleString()}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No accounts connected yet.
            </p>
          )
        }
      </CardContent>
    </Card>
  )
}