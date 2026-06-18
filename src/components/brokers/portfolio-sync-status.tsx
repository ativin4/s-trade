'use client'

import { useState } from 'react'
import type { BrokerAccount } from '@/app/types'
import { BROKER_META } from '@/components/brokers/broker-connection-card'

interface PortfolioSyncStatusProps {
  brokerAccounts: BrokerAccount[]
}

export function PortfolioSyncStatus({ brokerAccounts }: PortfolioSyncStatusProps) {
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch('/api/portfolio', { method: 'GET' })
      if (!res.ok) throw new Error(`Sync failed (${res.status})`)
      setLastSynced(new Date())
    } catch (e) {
      setSyncError((e as Error).message)
    } finally { setSyncing(false) }
  }

  if (brokerAccounts.length === 0) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#0f1117] border border-slate-800 rounded-xl">
      <div className="flex items-center gap-3">
        {/* Broker logos stacked */}
        <div className="flex -space-x-2">
          {brokerAccounts.slice(0, 3).map(acc => (
            <div key={acc.id} className="w-7 h-7 rounded-lg overflow-hidden border-2 border-[#0f1117]">
              {BROKER_META[acc.brokerName]?.logo ?? (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                  {acc.brokerName[0]?.toUpperCase()}
                </div>
              )}
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-white">
            {brokerAccounts.length} broker{brokerAccounts.length !== 1 ? 's' : ''} connected
          </p>
          <p className="text-[11px] text-slate-500">
            {syncError ? <span className="text-red-400">{syncError}</span>
              : lastSynced ? `Last synced ${lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
              : 'Portfolio sync ready'}
          </p>
        </div>
      </div>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50"
      >
        <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {syncing ? 'Syncing…' : 'Sync Now'}
      </button>
    </div>
  )
}
