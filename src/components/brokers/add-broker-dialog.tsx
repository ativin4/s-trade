'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { TextField } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import type { BrokerName } from '@/types'
import { Typography } from '@mui/material'

interface AddBrokerDialogProps {
  brokerName?: BrokerName
  children: React.ReactElement
}

type AddBrokerFormValues = {
  apiKey: string;
  apiSecret: string;
};

export function AddBrokerDialog({ brokerName, children }: AddBrokerDialogProps) {
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<AddBrokerFormValues>({})

  const onSubmit = (data: AddBrokerFormValues) => {
    console.log(data)
    // Here you would typically call a server action to save the broker connection
    setOpen(false)
  }


  return (
    <>
      <Button onClick={() => setOpen(true)}>Connect to {brokerName}</Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogTitle>Connect to {brokerName}</DialogTitle>
            <Typography variant="body2" className="mb-4">
              Enter your API credentials to connect your {brokerName} account.
            </Typography>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <TextField id="apiKey" type="text" {...register('apiKey')} />
              {errors.apiKey && <p className="text-sm text-red-500 mt-1">{errors.apiKey.message}</p>}
            </div>
            <div>
              <Label htmlFor="apiSecret">API Secret</Label>
              <TextField id="apiSecret" type="password" {...register('apiSecret')} />
              {errors.apiSecret && <p className="text-sm text-red-500 mt-1">{errors.apiSecret.message}</p>}
            </div>
            <Button type="submit">Connect</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
