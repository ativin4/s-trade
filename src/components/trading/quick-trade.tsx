'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import type { BrokerAccount } from '@/types'

interface QuickTradeProps {
  brokerAccounts: BrokerAccount[]
}

type QuickTradeFormValues = {
  symbol: string;
  quantity: number;
};

export function QuickTrade({ brokerAccounts }: QuickTradeProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<QuickTradeFormValues>({})

  const onBuy = (data: QuickTradeFormValues) => {
    // Example buy logic: show alert and log
    alert(`Buy order placed: ${data.quantity} shares of ${data.symbol}`);
    console.log('Buy order:', data);
    // Here you would call an API or update state
  }

  const onSell = (data: QuickTradeFormValues) => {
    // Example sell logic: show alert and log
    alert(`Sell order placed: ${data.quantity} shares of ${data.symbol}`);
    console.log('Sell order:', data);
    // Here you would call an API or update state
  }

  return (
    <Card>
      <CardHeader>
        <Typography variant='h6'>Quick Trade</Typography>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div>
            <Label htmlFor="quick-symbol">Symbol</Label>
            <TextField id="quick-symbol" {...register('symbol')} />
            {errors.symbol && <p className="text-sm text-red-500 mt-1">{errors.symbol.message}</p>}
          </div>
          <div>
            <Label htmlFor="quick-quantity">Quantity</Label>
            <TextField id="quick-quantity" type="number" {...register('quantity', { valueAsNumber: true })} />
            {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button type="button" onClick={handleSubmit(onBuy)} className="bg-bull-500 hover:bg-bull-600 text-white">Buy</Button>
            <Button type="button" onClick={handleSubmit(onSell)} className="bg-bear-500 hover:bg-bear-600 text-white">Sell</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
