'use client'

import { AddBrokerDialog } from '@/components/brokers/add-broker-dialog'

export function ConnectBrokerButton() {
  return (
    <AddBrokerDialog>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Connect Broker
      </button>
    </AddBrokerDialog>
  )
}
