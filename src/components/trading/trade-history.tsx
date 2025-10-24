import type { Trade } from '@/types'
import { Card, CardContent, CardHeader} from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface TradeHistoryProps {
  trades: (Trade & { brokerAccount: { brokerName: string } })[]
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <Typography variant='h6'>Trade History</Typography>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Broker</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.map(trade => (
              <TableRow key={trade.id}>
                <TableCell>{new Date(trade.createdAt).toLocaleString()}</TableCell>
                <TableCell>{trade.brokerAccount.brokerName}</TableCell>
                <TableCell>{trade.symbol}</TableCell>
                <TableCell>
                  <Badge
                    variant={trade.tradeType === 'BUY' ? 'default' : 'destructive'}
                    label={trade.tradeType}
                  />
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