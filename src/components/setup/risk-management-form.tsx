'use client'

import { useState } from 'react'
import type { UserSettings } from '@/app/types'

interface RiskManagementFormProps {
  userId: string
  initialSettings: UserSettings | null
}

export function RiskManagementForm({ userId, initialSettings }: RiskManagementFormProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [stopLossPct, setStopLossPct] = useState(2)
  const [targetPct, setTargetPct] = useState(5)
  const [maxPositions, setMaxPositions] = useState(10)
  const [maxDailyLoss, setMaxDailyLoss] = useState(5000)
  const [trailingStop, setTrailingStop] = useState(false)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stopLossPercent: stopLossPct,
          targetPercent: targetPct,
          maxOpenPositions: maxPositions,
          maxDailyLoss,
          trailingStopEnabled: trailingStop,
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
      {/* Stop loss */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Default Stop-Loss (%)
            <span className="text-slate-600 ml-1">— auto-applied to new positions</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0.5} max={10} step={0.5}
              value={stopLossPct}
              onChange={e => setStopLossPct(Number(e.target.value))}
              className="flex-1 accent-violet-500"
            />
            <span className="text-white text-sm font-mono w-12 text-right">{stopLossPct}%</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Default Target (%)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1} max={20} step={0.5}
              value={targetPct}
              onChange={e => setTargetPct(Number(e.target.value))}
              className="flex-1 accent-emerald-500"
            />
            <span className="text-white text-sm font-mono w-12 text-right">{targetPct}%</span>
          </div>
        </div>
      </div>

      {/* Ratio display */}
      <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-between">
        <span className="text-xs text-slate-500">Risk:Reward Ratio</span>
        <span className={`text-sm font-semibold ${
          targetPct / stopLossPct >= 2 ? 'text-emerald-400' : 'text-amber-400'
        }`}>
          1 : {(targetPct / stopLossPct).toFixed(1)}
        </span>
      </div>

      {/* Position limits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Max Open Positions</label>
          <input
            type="number"
            value={maxPositions}
            onChange={e => setMaxPositions(Number(e.target.value))}
            min={1} max={50}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Max Daily Loss (₹)</label>
          <input
            type="number"
            value={maxDailyLoss}
            onChange={e => setMaxDailyLoss(Number(e.target.value))}
            min={1000} step={1000}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Trailing stop */}
      <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
        <div>
          <p className="text-sm font-medium text-white">Trailing Stop-Loss</p>
          <p className="text-xs text-slate-500 mt-0.5">Automatically adjust stop-loss as price moves in your favour</p>
        </div>
        <button
          onClick={() => setTrailingStop(!trailingStop)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            trailingStop ? 'bg-violet-600' : 'bg-slate-700'
          }`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            trailingStop ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Risk Settings'}
      </button>
    </div>
  )
}
