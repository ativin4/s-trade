import type { BrokerAccount } from '@/types'
import { Card, CardContent, CardHeader} from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import { Button } from '@/components/ui/button'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface BrokerConnectionCardProps {
  account: BrokerAccount
}

export function BrokerConnectionCard({ account }: BrokerConnectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* <span className="text-2xl">{account.logo}</span> */}
            <div>
              <Typography variant='h6' className="text-lg">{account.brokerName}</Typography>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {account.isActive ? (
                  <CheckCircleIcon className="w-3 h-3 text-bull-500" />
                ) : (
                  <CancelIcon className="w-3 h-3 text-bear-500" />
                )}
                <span>{account.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
          <Button variant="outlined" size="small">
            Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {/* <p>Last synced: {new Date(account.lastSync).toLocaleString()}</p> */}
          {/* <p>Holdings: {account.portfolio?.length ?? 0}</p> */}
        </div>
      </CardContent>
    </Card>
  )
}
