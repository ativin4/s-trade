'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectItem } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import type { BrokerAccount, UserSettings } from '@/types'

interface TradingPanelProps {
  brokerAccounts: BrokerAccount[]
  userSettings: UserSettings | null
}

type TradingFormValues = {
  symbol: string;
  quantity: number;
  price?: number;
  orderType: 'MARKET' | 'LIMIT';
  transactionType: 'BUY' | 'SELL';
  broker: string;
};

export function TradingPanel({ brokerAccounts, userSettings }: TradingPanelProps) {
  const [transactionType, setTransactionType] = useState('BUY')
  const { register, handleSubmit, formState: { errors }, watch } = useForm<TradingFormValues>({
    defaultValues: {
      orderType: 'MARKET',
      transactionType: 'BUY',
    },
  })

  const onSubmit = (data: TradingFormValues) => {
    console.log(data)
    // Here you would typically call a server action to place the trade
  }

  return (
    <Card>
      <CardHeader>
        <Typography variant='h6'>Trading Panel</Typography>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={transactionType === 'BUY' ? 'contained' : 'outlined'}
              onClick={() => setTransactionType('BUY')}
            >
              Buy
            </Button>
            <Button
              type="button"
              variant={transactionType === 'SELL' ? 'contained' : 'outlined'}
              onClick={() => setTransactionType('SELL')}
            >
              Sell
            </Button>
          </div>

          <div>
            <Label htmlFor="broker">Broker</Label>
            <Select id="broker" {...register('broker')}>
                {brokerAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.brokerName}
                  </SelectItem>
                ))}
            </Select>
            {errors.broker && <p className="text-sm text-red-500 mt-1">{errors.broker.message}</p>}
          </div>

          <div>
            <Label htmlFor="symbol">Symbol</Label>
            <TextField id="symbol" {...register('symbol')} />
            {errors.symbol && <p className="text-sm text-red-500 mt-1">{errors.symbol.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <TextField id="quantity" type="number" {...register('quantity', { valueAsNumber: true })} />
              {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <Label htmlFor="orderType">Order Type</Label>
              <Select id="orderType" {...register('orderType')}>
                  <SelectItem value="MARKET">Market</SelectItem>
                  <SelectItem value="LIMIT">Limit</SelectItem>
              </Select>
            </div>
          </div>

          {watch('orderType') === 'LIMIT' && (
            <div>
              <Label htmlFor="price">Price</Label>
              <TextField id="price" type="number" {...register('price', { valueAsNumber: true })} />
              {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>}
            </div>
          )}

          <Button type="submit" className="w-full">Submit Order</Button>
        </form>
      </CardContent>
    </Card>
  )
}