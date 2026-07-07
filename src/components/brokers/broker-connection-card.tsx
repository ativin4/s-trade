'use client'

import { useState } from 'react'
import type { BrokerAccount, BrokerName } from '@/app/types'
import { AddBrokerDialog } from '@/components/brokers/add-broker-dialog'
import { disconnectBroker } from '@/lib/actions/broker'
import { cn } from '@/lib/utils'
import { isGrowwMcp } from '@/lib/broker-constants'

// ── broker brand config ───────────────────────────────────────────────────────

interface BrokerMetaEntry {
  label:  string
  color:  string
  region: 'IN' | 'US'
  live:   boolean    // false = coming soon
  logo:   React.ReactNode
}

function LetterLogo({ bg, text, textColor = 'white' }: { bg: string; text: string; textColor?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="40" height="40" rx="10" fill={bg}/>
      <text x="20" y="20" fontFamily="Arial Black, Arial" fontWeight="900" fontSize={text.length > 2 ? '11' : '15'} fill={textColor} textAnchor="middle" dominantBaseline="middle">{text}</text>
    </svg>
  )
}

export const BROKER_META: Record<string, BrokerMetaEntry> = {
  // ── India ──────────────────────────────────────────────────────────────────
  groww: {
    label: 'Groww', color: '#00D09C', region: 'IN', live: true,
    logo: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="40" height="40" rx="10" fill="#00D09C"/>
        <path d="M21 10C14 10 10 14.5 10 20C10 25.5 14 30 21 30C25 30 28 28.5 30 26L30 19.5L21 19.5L21 22.5L26.5 22.5C25.5 25 23.5 26.5 21 26.5C16 26.5 13 23.5 13 20C13 16.5 16 13.5 21 13.5C23.5 13.5 25.5 14.5 27 16L29.5 13.5C27.5 11.5 24.5 10 21 10Z" fill="white"/>
      </svg>
    ),
  },
  zerodha: {
    label: 'Zerodha', color: '#387ED1', region: 'IN', live: true,
    logo: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="40" height="40" rx="10" fill="#1a1a2e"/>
        <path d="M20 6L32 20L20 26L8 20Z" fill="#387ED1"/>
        <path d="M20 26L23 36L20 34L17 36Z" fill="#387ED1" opacity="0.6"/>
        <circle cx="20" cy="19" r="3.5" fill="white"/>
      </svg>
    ),
  },
  '5paisa': {
    label: '5paisa', color: '#C8102E', region: 'IN', live: true,
    logo: <LetterLogo bg="#C8102E" text="5P"/>,
  },
  angelone: {
    label: 'Angel One', color: '#E8282C', region: 'IN', live: false,
    logo: <LetterLogo bg="#E8282C" text="A1"/>,
  },
  upstox: {
    label: 'Upstox', color: '#7B2FBE', region: 'IN', live: false,
    logo: <LetterLogo bg="#7B2FBE" text="UPX"/>,
  },
  icici: {
    label: 'ICICI Direct', color: '#F37B20', region: 'IN', live: false,
    logo: <LetterLogo bg="#F37B20" text="IC"/>,
  },
  hdfc: {
    label: 'HDFC Sec', color: '#004C8F', region: 'IN', live: false,
    logo: <LetterLogo bg="#004C8F" text="HD"/>,
  },
  kotak: {
    label: 'Kotak Sec', color: '#ED1C24', region: 'IN', live: false,
    logo: <LetterLogo bg="#ED1C24" text="KS"/>,
  },
  indmoney: {
    label: 'INDmoney', color: '#1A56DB', region: 'IN', live: false,
    logo: <LetterLogo bg="#1A56DB" text="IND"/>,
  },
  vested: {
    label: 'Vested Finance', color: '#00A86B', region: 'IN', live: false,
    logo: <LetterLogo bg="#003D27" text="VF" textColor="#00A86B"/>,
  },
  // ── US ─────────────────────────────────────────────────────────────────────
  robinhood: {
    label: 'Robinhood', color: '#00C805', region: 'US', live: false,
    logo: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="40" height="40" rx="10" fill="#1a1a1a"/>
        {/* Stylised feather */}
        <path d="M20 8C16 8 12 11 12 16C12 19 13.5 21.5 16 23L16 32L20 30L24 32L24 23C26.5 21.5 28 19 28 16C28 11 24 8 20 8Z" fill="#00C805"/>
        <circle cx="20" cy="16" r="3" fill="#1a1a1a"/>
      </svg>
    ),
  },
  ibkr: {
    label: 'IBKR', color: '#CC0000', region: 'US', live: false,
    logo: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="40" height="40" rx="10" fill="#0a0a0a"/>
        <rect x="10" y="12" width="4" height="16" fill="#CC0000"/>
        <path d="M18 12 H28 C30 12 32 13.5 32 16 C32 18 30.5 19.5 28.5 20 C30.5 20.5 32 22 32 24 C32 26.5 30 28 28 28 H18 Z" fill="#CC0000"/>
        <path d="M22 15 H27 C28 15 29 15.8 29 17 C29 18.2 28 19 27 19 H22 Z" fill="#0a0a0a"/>
        <path d="M22 21 H27.5 C28.8 21 30 22 30 23.5 C30 25 28.8 26 27.5 26 H22 Z" fill="#0a0a0a"/>
      </svg>
    ),
  },
  webull: {
    label: 'Webull', color: '#4AAEF5', region: 'US', live: false,
    logo: <LetterLogo bg="#0d1117" text="WB" textColor="#4AAEF5"/>,
  },
  schwab: {
    label: 'Schwab', color: '#00A0DF', region: 'US', live: false,
    logo: <LetterLogo bg="#003057" text="SCH"/>,
  },
}

const FALLBACK_LOGO = (name: string) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="40" height="40" rx="10" fill="#334155"/>
    <text x="20" y="20" fontFamily="Arial" fontWeight="700" fontSize="16" fill="white" textAnchor="middle" dominantBaseline="middle">
      {name[0]?.toUpperCase()}
    </text>
  </svg>
)

// ── component ─────────────────────────────────────────────────────────────────

interface BrokerConnectionCardProps {
  account: BrokerAccount
}

export function BrokerConnectionCard({ account }: BrokerConnectionCardProps) {
  const meta             = BROKER_META[account.brokerName]
  const isMcp            = isGrowwMcp(account)
  const label            = meta?.label ?? account.brokerName
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(account.isAdapterActive)
  const [error, setError] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  async function handleDisconnect() {
    setDisconnecting(true)
    setError(null)
    try {
      await disconnectBroker(account.id)
      window.location.reload()
    } catch (e) {
      setError((e as Error).message)
      setDisconnecting(false)
      setConfirmDisconnect(false)
    }
  }

  async function toggleSync() {
    setSyncing(true)
    setError(null)
    try {
      const method = synced ? 'DELETE' : 'POST'
      const res = await fetch('/api/broker/activate', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: account.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setSynced(!synced)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="relative flex flex-col bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden">
      {/* Brand accent bar */}
      <div className="h-[3px] w-full" style={{ backgroundColor: meta?.color ?? '#6366f1' }} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
            {meta ? meta.logo : FALLBACK_LOGO(account.brokerName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm leading-tight">{label}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span className="text-[11px] font-medium text-emerald-400">Connected</span>
              </span>
              {synced && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-violet-700/60 bg-violet-950/50 text-violet-400 uppercase tracking-wide">
                  Synced
                </span>
              )}
              {isMcp && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald-700/60 bg-emerald-950/50 text-emerald-400 uppercase tracking-wide">
                  MCP
                </span>
              )}
              {!isMcp && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-blue-700/60 bg-blue-950/50 text-blue-400 uppercase tracking-wide">
                  API
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Connection detail */}
        <div className="rounded-lg bg-slate-900/60 border border-slate-800/60 px-3 py-2 text-[11px] space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Connection</span>
            <span className="text-slate-300 font-medium">{isMcp ? 'Groww MCP Server' : 'API Key'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Client</span>
            <span className="text-slate-300 font-mono">
              {isMcp ? account.clientCode : `${account.clientCode?.slice(0, 10) ?? '—'}…`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">TOTP</span>
            <span className={account.totpSecret ? 'text-emerald-400' : 'text-slate-600'}>
              {account.totpSecret ? '✓ Configured' : 'Not set'}
            </span>
          </div>
        </div>

        {error && <p className="text-[11px] text-red-400">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2">
          <AddBrokerDialog brokerName={account.brokerName as BrokerName} connectionType="api">
            <button className="flex-1 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-xs font-medium hover:border-slate-500 hover:text-white transition-colors">
              Update
            </button>
          </AddBrokerDialog>

          {!isMcp && (
            <button
              onClick={toggleSync}
              disabled={syncing}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50',
                synced
                  ? 'bg-violet-900/40 border border-violet-700/60 text-violet-400 hover:bg-red-950/40 hover:border-red-700/60 hover:text-red-400'
                  : 'bg-violet-600 hover:bg-violet-500 text-white'
              )}
            >
              {syncing ? '…' : synced ? '✓ Synced' : 'Sync'}
            </button>
          )}

          {confirmDisconnect ? (
            <div className="flex gap-1">
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {disconnecting ? '…' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmDisconnect(false)}
                className="px-2 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-xs hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDisconnect(true)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-slate-600 text-xs hover:border-red-700/60 hover:text-red-400 transition-colors"
              title="Disconnect"
            >
              ✕
            </button>
          )}
        </div>

        {!isMcp && !synced && (
          <div className="mt-3 rounded-lg border border-amber-800/30 bg-amber-950/15 px-3 py-2 flex items-start gap-2">
            <span className="text-amber-400 text-xs mt-0.5">⚠</span>
            <div>
              <p className="text-[11px] text-amber-200/70">
                Whitelist <code className="font-mono bg-slate-900 px-1 rounded text-white select-all">161.118.174.252</code> in your broker&apos;s API IP allowlist, then click Sync.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
