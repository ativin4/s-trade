import type { BrokerAccount } from '@/types'
import { Card, CardContent, CardHeader} from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import { Button } from '@/components/ui/button'
import RefreshIcon from '@mui/icons-material/Refresh';

interface PortfolioSyncStatusProps {
  brokerAccounts: BrokerAccount[]
}

export function PortfolioSyncStatus({ brokerAccounts }: PortfolioSyncStatusProps) {
  // const lastSynced = brokerAccounts.length > 0 ? new Date(Math.max(...brokerAccounts.map(acc => new Date(acc.lastSync).getTime()))) : null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Typography variant='h6'>Portfolio Sync</Typography>
        <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>
          Sync Now
        </Button>
      </CardHeader>
      <CardContent>
        {
          // lastSynced ? (
          //   <p className="text-sm text-muted-foreground">
          //     Last synced: {lastSynced.toLocaleString()}
          //   </p>
          // ) : (
            <p className="text-sm text-muted-foreground">
              No accounts connected yet.
            </p>
          // )
        }
      </CardContent>
    </Card>
  )
}
