'use client'

import { useState, useRef, useEffect } from 'react'
import type { BrokerAccount, BrokerName } from '@/app/types'
import { BROKER_META } from '@/components/brokers/broker-connection-card'
import { AddBrokerDialog } from '@/components/brokers/add-broker-dialog'
import { cn } from '@/lib/utils'
import { isGrowwMcp } from '@/lib/broker-constants'

const BROKER_OPTIONS: Array<{ name: BrokerName; region: 'IN' | 'US'; live: boolean }> =
  Object.entries(BROKER_META).map(([name, meta]) => ({
    name: name as BrokerName,
    region: meta.region,
    live: meta.live,
  }))

interface BrokerIntegrationProps {
  brokerAccounts: BrokerAccount[]
}

type Pending = { name: BrokerName; type: 'api' | 'mcp'; key: number }

// Brokers that support both MCP and API connection types
const DUAL_CONN_BROKERS = new Set<BrokerName>(['groww'])

export function BrokerIntegration({ brokerAccounts }: BrokerIntegrationProps) {
  const [open, setOpen]         = useState(false)
  const [pending, setPending]   = useState<Pending | null>(null)
  const [subPick, setSubPick]   = useState<BrokerName | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSubPick(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const connectedNames = new Set(brokerAccounts.map(a => a.brokerName))
  const available = BROKER_OPTIONS.filter(b => b.live && !connectedNames.has(b.name))
  const india = available.filter(b => b.region === 'IN')
  const us    = available.filter(b => b.region === 'US')

  const pick = (name: BrokerName) => {
    if (DUAL_CONN_BROKERS.has(name)) {
      setSubPick(name)
      return
    }
    setOpen(false)
    setSubPick(null)
    setPending(p => ({ name, type: 'api', key: (p?.key ?? 0) + 1 }))
  }

  const pickType = (name: BrokerName, type: 'api' | 'mcp') => {
    setOpen(false)
    setSubPick(null)
    setPending(p => ({ name, type, key: (p?.key ?? 0) + 1 }))
  }

  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-xl">

      {/* Connected accounts */}
      {brokerAccounts.length === 0 ? (
        <div className="px-4 py-5 text-center">
          <p className="text-xs text-slate-600">No brokers connected</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {brokerAccounts.map(acc => {
            const meta  = BROKER_META[acc.brokerName]
            const isMcp = isGrowwMcp(acc)
            return (
              <div key={acc.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                  {meta?.logo ?? <FallbackLogo name={acc.brokerName} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{meta?.label ?? acc.brokerName}</p>
                  <p className="text-[11px] text-slate-500">{isMcp ? 'MCP' : 'API'}</p>
                </div>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-medium text-emerald-400">Live</span>
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Add broker row */}
      <div ref={dropRef} className="relative border-t border-slate-800/60">
        <button
          onClick={() => setOpen(v => !v)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
            open ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'
          )}
        >
          {/* Plus icon */}
          <div className="w-8 h-8 rounded-lg border border-dashed border-slate-700 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-sm text-slate-400 flex-1">Connect a broker</span>
          <svg
            className={cn('w-4 h-4 text-slate-600 transition-transform', open && 'rotate-180')}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Dropdown panel */}
        {open && (
          <div className="absolute top-full left-0 right-0 bg-[#0d0f14] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden mt-1 max-h-80 overflow-y-auto">
            {subPick ? (
              <ConnTypeSubPicker name={subPick} onBack={() => setSubPick(null)} onPick={pickType} />
            ) : (
              <>
                <BrokerPickerGroup label="India"          brokers={india} onPick={pick} />
                <BrokerPickerGroup label="United States"  brokers={us}    onPick={pick} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Dialog — key changes on every pick so it remounts and auto-opens */}
      {pending && (
        <AutoOpenDialog key={pending.key} brokerName={pending.name} connectionType={pending.type} />
      )}
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

function FallbackLogo({ name }: { name: string }) {
  return (
    <div className="w-full h-full bg-slate-700 flex items-center justify-center text-[11px] font-bold text-white">
      {name[0]?.toUpperCase()}
    </div>
  )
}

function BrokerPickerGroup({
  label, brokers, onPick,
}: {
  label: string
  brokers: Array<{ name: BrokerName }>
  onPick: (name: BrokerName) => void
}) {
  if (!brokers.length) return null
  return (
    <div>
      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-3 pt-2.5 pb-1">{label}</p>
      {brokers.map(({ name }) => {
        const meta = BROKER_META[name]
        return (
          <button
            key={name}
            onClick={() => onPick(name)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-800/70 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
              {meta?.logo ?? <FallbackLogo name={name} />}
            </div>
            <span className="text-[13px] font-medium text-slate-200">{meta?.label ?? name}</span>
          </button>
        )
      })}
    </div>
  )
}

function ConnTypeSubPicker({
  name, onBack, onPick,
}: {
  name: BrokerName
  onBack: () => void
  onPick: (name: BrokerName, type: 'api' | 'mcp') => void
}) {
  const meta = BROKER_META[name]
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 pt-2.5 pb-1 text-[11px] text-slate-500 hover:text-white transition-colors"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>
      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-3 pb-1">
        Connect {meta?.label ?? name} via
      </p>
      <button
        onClick={() => onPick(name, 'mcp')}
        className="w-full flex flex-col px-3 py-2.5 text-left hover:bg-slate-800/70 transition-colors border-b border-slate-800/60"
      >
        <span className="text-[13px] font-medium text-slate-200">MCP (Recommended)</span>
        <span className="text-[11px] text-slate-500">One-click, no API key needed</span>
      </button>
      <button
        onClick={() => onPick(name, 'api')}
        className="w-full flex flex-col px-3 py-2.5 text-left hover:bg-slate-800/70 transition-colors"
      >
        <span className="text-[13px] font-medium text-slate-200">API Key</span>
        <span className="text-[11px] text-slate-500">TOTP auto-login with stored credentials</span>
      </button>
    </div>
  )
}

function AutoOpenDialog({ brokerName, connectionType }: { brokerName: BrokerName; connectionType: 'api' | 'mcp' }) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => { ref.current?.click() }, [])
  return (
    <AddBrokerDialog brokerName={brokerName} connectionType={connectionType}>
      <button ref={ref} className="hidden" aria-hidden />
    </AddBrokerDialog>
  )
}
