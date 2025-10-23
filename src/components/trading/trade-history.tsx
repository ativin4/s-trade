
import type { Trade } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TradeHistoryProps {
  trades: (Trade & { brokerAccount: { brokerName: string } })[]
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Broker</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map(trade => (
              <TableRow key={trade.id}>
                <TableCell>{new Date(trade.createdAt).toLocaleString()}</TableCell>
                <TableCell>{trade.brokerAccount.brokerName}</TableCell>
                <TableCell>{trade.symbol}</TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      trade.type === 'BUY' ? 'bg-bull-500' : 'bg-bear-500',
                      'text-white'
                    )}
                  >
                    {trade.type}
                  </Badge>
                </TableCell>
                <TableCell>{trade.quantity}</TableCell>
                <TableCell>₹{trade.price.toLocaleString('en-IN')}</TableCell>
                <TableCell>₹{(trade.quantity * trade.price).toLocaleString('en-IN')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
