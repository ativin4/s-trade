'use client'

import { useState } from 'react'
import type { UserSettings } from '@/app/types'

interface TradingPreferencesFormProps {
  userId: string
  initialSettings: UserSettings | null
}

const RISK_OPTIONS = ['Conservative', 'Moderate', 'Aggressive', 'Very Aggressive'] as const
const MARKET_CAP_OPTIONS = ['Large Cap', 'Mid Cap', 'Small Cap', 'All'] as const
const SECTOR_OPTIONS = [
  'Banking', 'IT', 'Pharma', 'Auto', 'FMCG', 'Energy', 'Metals',
  'Realty', 'Telecom', 'Media', 'Infrastructure',
]

export function TradingPreferencesForm({ userId, initialSettings }: TradingPreferencesFormProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [maxBudget, setMaxBudget] = useState(initialSettings?.maxBudgetPerTrade ?? 50000)
  const [riskTolerance, setRiskTolerance] = useState(initialSettings?.riskTolerance ?? 'Moderate')
  const [autoTrading, setAutoTrading] = useState(initialSettings?.autoTradingEnabled ?? false)
  const [marketCap, setMarketCap] = useState(initialSettings?.preferredMarketCap ?? 'All')
  const [excludedSectors, setExcludedSectors] = useState<string[]>(initialSettings?.excludedSectors ?? [])

  function toggleSector(sector: string) {
    setExcludedSectors(prev =>
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    )
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxBudgetPerTrade: maxBudget,
          riskTolerance,
          autoTradingEnabled: autoTrading,
          preferredMarketCap: marketCap,
          excludedSectors,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Max budget */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Max Budget Per Trade (₹)</label>
        <input
          type="number"
          value={maxBudget}
          onChange={e => setMaxBudget(Number(e.target.value))}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
          min={1000}
          step={1000}
        />
      </div>

      {/* Risk tolerance */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Risk Tolerance</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RISK_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setRiskTolerance(opt)}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                riskTolerance === opt
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred market cap */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Preferred Market Cap</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MARKET_CAP_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setMarketCap(opt)}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                marketCap === opt
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Excluded sectors */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">
          Excluded Sectors
          <span className="text-slate-600 ml-1">(sectors to avoid)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {SECTOR_OPTIONS.map(sector => (
            <button
              key={sector}
              onClick={() => toggleSector(sector)}
              className={`py-1 px-2.5 rounded-full text-xs font-medium border transition-colors ${
                excludedSectors.includes(sector)
                  ? 'bg-red-950/50 border-red-700/60 text-red-400'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {excludedSectors.includes(sector) ? '✕ ' : ''}{sector}
            </button>
          ))}
        </div>
      </div>

      {/* Auto trading toggle */}
      <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
        <div>
          <p className="text-sm font-medium text-white">Auto Trading</p>
          <p className="text-xs text-slate-500 mt-0.5">Allow AI to place orders automatically</p>
        </div>
        <button
          onClick={() => setAutoTrading(!autoTrading)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            autoTrading ? 'bg-violet-600' : 'bg-slate-700'
          }`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            autoTrading ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Preferences'}
      </button>
    </div>
  )
}
