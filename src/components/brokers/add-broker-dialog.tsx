'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import type { BrokerName } from '@/types'

interface AddBrokerDialogProps {
  brokerName?: BrokerName
  children: React.ReactNode
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect to {brokerName}</DialogTitle>
          <DialogDescription>
            Enter your API credentials to connect your {brokerName} account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input id="apiKey" type="text" {...register('apiKey')} />
            {errors.apiKey && <p className="text-sm text-red-500 mt-1">{errors.apiKey.message}</p>}
          </div>
          <div>
            <Label htmlFor="apiSecret">API Secret</Label>
            <Input id="apiSecret" type="password" {...register('apiSecret')} />
            {errors.apiSecret && <p className="text-sm text-red-500 mt-1">{errors.apiSecret.message}</p>}
          </div>
          <Button type="submit">Connect</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}