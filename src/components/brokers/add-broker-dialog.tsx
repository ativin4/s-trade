'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { BrokerName } from '@/app/types'
import { connectBroker } from '@/lib/actions/broker'
import { GROWW_MCP_SENTINEL } from '@/lib/broker-constants'
import { BROKER_META } from '@/components/brokers/broker-connection-card'

interface AddBrokerDialogProps {
  brokerName?: BrokerName
  connectionType?: 'api' | 'mcp'
  children: React.ReactElement
}

type ExtraCreds = { userKey?: string; realClientCode?: string; realTotpSecret?: string; pin?: string; accessToken?: string }

type FormValues = {
  clientCode: string
  totpSecret: string
  apiSecret?: string
  jwtToken?: string
  feedToken?: string
  extra?: ExtraCreds
}

type ExtraField = { name: 'totpSecret' | 'jwtToken' | 'feedToken' | `extra.${keyof ExtraCreds}`; label: string; hint?: string; tooltip?: string }
type BrokerConfig = { clientCodeLabel: string; apiSecretRequired?: boolean; apiSecretLabel?: string; apiSecretHint?: string; extraFields?: ExtraField[]; extraFieldsAlt?: ExtraField[]; altModeLabel?: string }

// App-level credentials shared by both 5paisa login modes
const FIVEPAISA_APP_FIELDS: ExtraField[] = [
  { name: 'totpSecret', label: 'App Name' },
  { name: 'jwtToken',   label: 'Source' },
  { name: 'feedToken',  label: 'Encryption Key' },
]

// Per-user credential present in both modes (User Key identifies the trader, not the app)
const FIVEPAISA_USER_KEY_FIELD: ExtraField = {
  name: 'extra.userKey', label: 'User Key (API Key)',
  hint: 'From xstream.5paisa.com/dashboard — labeled "API Key", distinct from Encryption Key.',
}

const BROKER_CONFIG: Partial<Record<BrokerName, BrokerConfig>> = {
  groww:     {
    clientCodeLabel: 'API Key', apiSecretRequired: false,
    extraFields: [
      {
        name: 'totpSecret', label: 'TOTP Secret',
        hint: 'Stored encrypted. Used to auto-generate OTP on every login.',
        tooltip: 'A base32 secret key shown when you set up a 2FA authenticator app. Find it in: Groww app → Profile → Security → Set up authenticator. Save the text key shown below the QR code.',
      },
    ],
  },
  zerodha:   { clientCodeLabel: 'API Key' },
  '5paisa':  {
    clientCodeLabel: 'User ID',
    apiSecretLabel: 'Password',
    apiSecretHint: 'Your regular 5paisa login password',
    altModeLabel: 'Access Token',
    extraFields: [
      ...FIVEPAISA_APP_FIELDS,
      FIVEPAISA_USER_KEY_FIELD,
      { name: 'extra.realClientCode', label: 'Demat Client Code', hint: 'Your 5paisa trading account number (e.g. 58199171) — not the App User ID above.' },
      {
        name: 'extra.realTotpSecret', label: 'Account TOTP Secret',
        hint: '5paisa app → My Account → Security → Set up TOTP authenticator → save the text key shown below the QR code.',
        tooltip: 'A base32 key (e.g. GU4DCOJZ…) that lets s-trade generate a fresh 6-digit OTP every 30 seconds to log in automatically. Get it by enabling the authenticator app in 5paisa → My Account → Security → TOTP setup.',
      },
      { name: 'extra.pin', label: 'Trading PIN', hint: 'Your 5paisa 5-digit or 6-digit trading PIN.' },
    ],
    extraFieldsAlt: [
      ...FIVEPAISA_APP_FIELDS,
      FIVEPAISA_USER_KEY_FIELD,
      {
        name: 'extra.accessToken', label: 'Access Token',
        hint: 'Valid until 11:59 PM today. Get it from the 5paisa app or run a one-time login script.',
        tooltip: 'An Access Token is a session credential issued after login. It lets s-trade make API calls on your behalf without storing your password. Expires daily at 11:59 PM — you\'ll need to refresh it each day.',
      },
    ],
  },
  ibkr:      { clientCodeLabel: 'Account Number' },
  indmoney:  { clientCodeLabel: 'Mobile / Email' },
  vested:    { clientCodeLabel: 'Email' },
}
const DEFAULT_CFG: BrokerConfig = { clientCodeLabel: 'API Key', apiSecretRequired: true }

export function AddBrokerDialog({ brokerName, connectionType = 'api', children }: AddBrokerDialogProps) {
  const [open, setOpen]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [mcpDone, setMcpDone]     = useState(false)
  const [altMode, setAltMode]     = useState(false)

  const cfg          = brokerName ? (BROKER_CONFIG[brokerName] ?? DEFAULT_CFG) : DEFAULT_CFG
  const isMcp        = connectionType === 'mcp' && brokerName === 'groww'
  const label        = brokerName ? (BROKER_META[brokerName]?.label ?? brokerName) : ''
  const activeFields = altMode && cfg.extraFieldsAlt ? cfg.extraFieldsAlt : cfg.extraFields
  const showApiSecret = cfg.apiSecretRequired !== false

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>()

  const close = () => { setOpen(false); setError(null); setMcpDone(false); setAltMode(false); reset() }

  const onSubmit = async (data: FormValues) => {
    if (!brokerName) return
    setLoading(true); setError(null)
    try {
      await connectBroker(brokerName, {
        clientCode: data.clientCode,
        apiSecret:  data.apiSecret  || undefined,
        totpSecret: data.totpSecret || undefined,
        jwtToken:   data.jwtToken   || undefined,
        feedToken:  data.feedToken  || undefined,
        extra:      data.extra,
      })
      close()
      window.location.reload()
    } catch (err) { setError((err as Error).message) }
    finally { setLoading(false) }
  }

  const connectMcp = async () => {
    setLoading(true); setError(null)
    try {
      await connectBroker('groww', { clientCode: GROWW_MCP_SENTINEL })
      setMcpDone(true)
      setTimeout(() => { close(); window.location.reload() }, 1200)
    } catch (err) { setError((err as Error).message) }
    finally { setLoading(false) }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-[#0d0f14] border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white">
                {isMcp ? 'Connect Groww via MCP' : `Connect ${label}`}
              </h2>
              <button
                onClick={close}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              {isMcp ? (
                mcpDone ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-white">Groww connected via MCP!</p>
                    <p className="text-xs text-slate-500 text-center">Your portfolio will sync automatically.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-400">
                      Groww&apos;s official MCP server gives s-trade read-only access to your
                      portfolio, holdings, and positions — no API key required.
                    </p>
                    <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 space-y-2">
                      <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">What s-trade can access</p>
                      <ul className="text-sm text-emerald-200/70 space-y-1">
                        {['Equity holdings & current P&L', "Today's trading positions", 'Available margin', 'Order history'].map(t => (
                          <li key={t} className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <button
                      onClick={connectMcp}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Connecting…' : 'Connect via Groww MCP'}
                    </button>
                    <p className="text-[11px] text-slate-600 text-center">
                      MCP server at mcp.groww.in is already authorised in your Claude Code setup.
                    </p>
                  </>
                )
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-3 space-y-1">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">Before you connect</p>
                    <p className="text-xs text-amber-200/70">
                      Whitelist this IP in your broker&apos;s API settings:
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs font-mono bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-white select-all">
                        161.118.174.252
                      </code>
                      <span className="text-[10px] text-amber-200/50">(s-trade broker adapter)</span>
                    </div>
                  </div>

                  {cfg.extraFieldsAlt && (
                    <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs font-medium">
                      <button type="button" onClick={() => setAltMode(false)}
                        className={`flex-1 py-2 transition-colors ${!altMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                        TOTP Login
                      </button>
                      <button type="button" onClick={() => setAltMode(true)}
                        className={`flex-1 py-2 transition-colors ${altMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                        {cfg.altModeLabel ?? 'Access Token'}
                      </button>
                    </div>
                  )}

                  <Field label={cfg.clientCodeLabel} error={errors.clientCode?.message}>
                    <input
                      placeholder={brokerName === 'groww' ? 'gk_...' : ''}
                      className={inputCls}
                      {...register('clientCode', { required: 'Required' })}
                    />
                  </Field>

                  {activeFields?.map(f => {
                    const [parent, child] = f.name.split('.') as [keyof FormValues, string | undefined]
                    const fieldError = child
                      ? (errors[parent] as Record<string, { message?: string }> | undefined)?.[child]?.message
                      : errors[parent]?.message
                    return (
                      <Field key={f.name} label={f.label} error={fieldError} hint={f.hint} tooltip={f.tooltip}>
                        <input
                          type="password"
                          className={inputCls}
                          {...register(f.name, { required: `${f.label} is required` })}
                        />
                      </Field>
                    )
                  })}

                  {showApiSecret && (
                    <Field label={cfg.apiSecretLabel ?? "API Secret"} error={errors.apiSecret?.message} hint={cfg.apiSecretHint}>
                      <input
                        type="password"
                        className={inputCls}
                        {...register('apiSecret', { required: 'Required' })}
                      />
                    </Field>
                  )}

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Connecting…' : `Connect ${label}`}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const inputCls = 'w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors'

function Field({ label, error, hint, tooltip, children }: { label: string; error?: string; hint?: string; tooltip?: string; children: React.ReactNode }) {
  const [tip, setTip] = useState(false)
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setTip(true)}
              onMouseLeave={() => setTip(false)}
              onClick={() => setTip(v => !v)}
              className="w-3.5 h-3.5 rounded-full border border-slate-600 text-slate-500 hover:text-white hover:border-slate-400 flex items-center justify-center text-[9px] font-bold leading-none transition-colors"
            >?</button>
            {tip && (
              <div className="absolute left-0 bottom-5 z-10 w-64 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] text-slate-300 shadow-xl">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      {children}
      {hint  && !error && <p className="text-[11px] text-slate-600 mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}
