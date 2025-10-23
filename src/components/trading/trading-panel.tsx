
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const { register, handleSubmit, formState: { errors } } = useForm<TradingFormValues>({
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
        <CardTitle>Trading Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={transactionType === 'BUY' ? 'default' : 'outline'}
              onClick={() => setTransactionType('BUY')}
              className="bg-bull-500 hover:bg-bull-600 text-white"
            >
              Buy
            </Button>
            <Button
              type="button"
              variant={transactionType === 'SELL' ? 'default' : 'outline'}
              onClick={() => setTransactionType('SELL')}
              className="bg-bear-500 hover:bg-bear-600 text-white"
            >
              Sell
            </Button>
          </div>

          <div>
            <Label htmlFor="broker">Broker</Label>
            <Select {...register('broker')}>
              <SelectTrigger>
                <SelectValue placeholder="Select a broker" />
              </SelectTrigger>
              <SelectContent>
                {brokerAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.brokerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.broker && <p className="text-sm text-red-500 mt-1">{errors.broker.message}</p>}
          </div>

          <div>
            <Label htmlFor="symbol">Symbol</Label>
            <Input id="symbol" {...register('symbol')} />
            {errors.symbol && <p className="text-sm text-red-500 mt-1">{errors.symbol.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" {...register('quantity', { valueAsNumber: true })} />
              {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <Label htmlFor="orderType">Order Type</Label>
              <Select {...register('orderType')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARKET">Market</SelectItem>
                  <SelectItem value="LIMIT">Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Show price input only for LIMIT orders */}
          {/* @ts-ignore */}
          {watch('orderType') === 'LIMIT' && (
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
              {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>}
            </div>
          )}

          <Button type="submit" className="w-full">Submit Order</Button>
        </form>
      </CardContent>
    </Card>
  )
}
