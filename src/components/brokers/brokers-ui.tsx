'use client'

import { AddBrokerDialog } from '@/components/brokers/add-broker-dialog'
import { BrokerConnectionCard, BROKER_META } from '@/components/brokers/broker-connection-card'
import { PortfolioSyncStatus } from '@/components/brokers/portfolio-sync-status'
import { cn } from '@/lib/utils'
import type { BrokerAccount, BrokerName } from '@/app/types'

// ── catalogue derived from BROKER_META so single source of truth ──────────────

const BROKER_FEATURES: Partial<Record<BrokerName, string[]>> = {
  groww:     ['MCP (no key needed)', 'MF & Stocks', 'F&O', 'Research'],
  zerodha:   ['Kite Connect', 'Algo trading', 'Advanced charts', 'Low brokerage'],
  '5paisa':  ['Real-time data', 'Options', 'Margin', 'API'],
  angelone:  ['Smart API', 'Options', 'Research', 'Mobile-first'],
  upstox:    ['Pro Web', 'Options', 'MF', 'API'],
  icici:     ['ICICIdirect', 'Research', 'MF', 'NRI accounts'],
  hdfc:      ['HDFC Sky', 'Research', 'MF', 'Demat'],
  kotak:     ['Kotak Neo', 'Options', 'MF', 'Research'],
  indmoney:  ['US stocks', 'MF', 'SGB', 'NPS', 'Tax filing'],
  vested:    ['US stocks', 'ETFs', 'Fractional shares', 'DRiP'],
  robinhood: ['Commission-free', 'Options', 'Crypto', 'US markets'],
  ibkr:      ['US & global markets', 'IBKR India supported', 'Options', 'Margin'],
  webull:    ['Extended hours', 'Options', 'Crypto', 'Paper trading'],
  schwab:    ['No minimum', 'Research', 'ETFs', 'US markets'],
}

const BROKER_CONN_TYPES: Partial<Record<BrokerName, ('api' | 'mcp')[]>> = {
  groww: ['mcp', 'api'],
}

// ── component ─────────────────────────────────────────────────────────────────

interface BrokersUIProps {
  brokerAccounts: BrokerAccount[]
}

export function BrokersUI({ brokerAccounts }: BrokersUIProps) {
  return (
    <div className="space-y-8">
      {/* Connected accounts */}
      {brokerAccounts.length > 0 && (
        <section>
          <SectionHeader
            title="Connected Accounts"
            count={brokerAccounts.length}
            countColor="text-emerald-400"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brokerAccounts.map(account => (
              <BrokerConnectionCard key={account.id} account={account} />
            ))}
          </div>
        </section>
      )}

      {/* Portfolio sync */}
      <PortfolioSyncStatus brokerAccounts={brokerAccounts} />

      {/* Available brokers — India */}
      <BrokerSection title="India" brokerAccounts={brokerAccounts} region="IN" />

      {/* Available brokers — US */}
      <BrokerSection title="United States" brokerAccounts={brokerAccounts} region="US" />

      {/* Info banner */}
      <div className="rounded-xl bg-blue-950/30 border border-blue-900/50 p-4">
        <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-2">Connecting your broker</p>
        <div className="space-y-1.5 text-[13px] text-blue-200/60">
          <p><span className="text-blue-300 font-semibold">MCP (Groww)</span> — one-click, no API keys. Authorise once, portfolio syncs automatically.</p>
          <p><span className="text-blue-300 font-semibold">API Key</span> — generate from your broker's developer portal. All credentials encrypted at rest with AES-256-GCM.</p>
        </div>
      </div>
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

function BrokerSection({ title, brokerAccounts, region }: { title: string; brokerAccounts: BrokerAccount[]; region: 'IN' | 'US' }) {
  const brokers = Object.entries(BROKER_META).filter(([, m]) => m.region === region)
  if (!brokers.length) return null
  return (
    <section>
      <SectionHeader title={title} count={brokers.length} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brokers.map(([name, meta]) => {
          const brokerName  = name as BrokerName
          const isConnected = brokerAccounts.some(a => a.brokerName === brokerName)
          const connTypes   = BROKER_CONN_TYPES[brokerName] ?? ['api']
          const features    = BROKER_FEATURES[brokerName] ?? []

          return (
            <div
              key={name}
              className={cn(
                'relative flex flex-col bg-[#0f1117] border rounded-xl overflow-hidden transition-colors',
                isConnected ? 'border-emerald-800/50' : meta.live ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/50 opacity-60'
              )}
            >
              <div className="h-[3px] w-full" style={{ backgroundColor: meta.color }} />
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">{meta.logo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white text-sm">{meta.label}</p>
                      {isConnected && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-medium">Connected</span>
                        </span>
                      )}
                      {!meta.live && <StatusPill label="Soon" color="gray" />}
                    </div>
                  </div>
                </div>

                {features.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {features.map(f => (
                      <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">{f}</span>
                    ))}
                  </div>
                )}

                <div className="mt-auto space-y-2">
                  {!meta.live ? (
                    <button disabled className="w-full py-1.5 rounded-lg border border-slate-800 text-slate-600 text-xs font-medium cursor-not-allowed">Coming Soon</button>
                  ) : isConnected ? (
                    <AddBrokerDialog brokerName={brokerName} connectionType="api">
                      <button className="w-full py-1.5 rounded-lg border border-slate-700 text-slate-400 text-xs font-medium hover:border-slate-500 hover:text-white transition-colors">Update Credentials</button>
                    </AddBrokerDialog>
                  ) : (
                    <>
                      {connTypes.includes('mcp') && (
                        <AddBrokerDialog brokerName={brokerName} connectionType="mcp">
                          <button className="w-full py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: meta.color }}>Connect via MCP</button>
                        </AddBrokerDialog>
                      )}
                      <AddBrokerDialog brokerName={brokerName} connectionType="api">
                        <button className="w-full py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-slate-800" style={{ borderColor: meta.color, color: meta.color }}>
                          Connect via API Key
                        </button>
                      </AddBrokerDialog>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function SectionHeader({ title, count, countColor }: { title: string; count: number; countColor?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-sm font-bold text-white uppercase tracking-widest">{title}</h2>
      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800', countColor ?? 'text-slate-400')}>
        {count}
      </span>
    </div>
  )
}

function StatusPill({ label, color }: { label: string; color: 'yellow' | 'gray' }) {
  const cls = color === 'yellow'
    ? 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50'
    : 'bg-slate-800 text-slate-500 border-slate-700'
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-semibold', cls)}>
      {label}
    </span>
  )
}
