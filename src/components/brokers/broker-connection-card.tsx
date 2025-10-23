import type { BrokerAccount } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'

interface BrokerConnectionCardProps {
  account: BrokerAccount
}

export function BrokerConnectionCard({ account }: BrokerConnectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{account.logo}</span>
            <div>
              <CardTitle className="text-lg">{account.brokerName}</CardTitle>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {account.isActive ? (
                  <CheckCircle className="w-3 h-3 text-bull-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-bear-500" />
                )}
                <span>{account.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>Last synced: {new Date(account.lastSync).toLocaleString()}</p>
          <p>Holdings: {account.portfolio?.length ?? 0}</p>
        </div>
      </CardContent>
    </Card>
  )
}