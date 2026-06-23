'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}
function pinHashKey(userId: string) { return `strade_pin_${userId}` }
async function hashPin(userId: string, pin: string) { return sha256(`strade:${userId}:${pin}`) }
function getHash(userId: string) { try { return localStorage.getItem(pinHashKey(userId)) } catch { return null } }
function setHash(userId: string, hash: string) { try { localStorage.setItem(pinHashKey(userId), hash) } catch { /* */ } }
function clearHash(userId: string) { try { localStorage.removeItem(pinHashKey(userId)) } catch { /* */ } }

function MiniPad({ title, onComplete, error }: { title: string; onComplete: (pin: string) => void; error?: string | null }) {
  const [pin, setPin] = useState('')

  const press = useCallback((k: string) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return }
    if (!k) return
    setPin(p => {
      const next = p + k
      if (next.length === 4) { onComplete(next); return '' }
      return next
    })
  }, [onComplete])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') press(e.key)
      else if (e.key === 'Backspace') press('⌫')
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [press])

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="flex gap-3">
        {[0,1,2,3].map(i => (
          <div key={i} className={cn('w-3 h-3 rounded-full border-2 transition-all', i < pin.length ? 'bg-blue-400 border-blue-400' : 'border-slate-600')} />
        ))}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="grid grid-cols-3 gap-2 max-w-[200px]">
        {KEYS.map((k, i) => (
          <button key={i} onClick={() => press(k)} disabled={!k}
            className={cn('h-12 rounded-xl text-lg font-semibold transition-all active:scale-95',
              !k ? 'invisible' : k === '⌫' ? 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 text-sm' : 'bg-slate-800 text-white hover:bg-slate-700'
            )}>
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}

type Phase = 'idle' | 'verify' | 'new1' | 'new2' | 'removing'

export function PinSettings() {
  const { data: session } = useSession()
  const userId = session?.user?.id ?? ''
  const [hasPin, setHasPin] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [pendingNew, setPendingNew] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [action, setAction] = useState<'change' | 'remove'>('change')

  useEffect(() => {
    if (userId) setHasPin(!!getHash(userId))
  }, [userId])

  const startChange = () => { setAction('change'); setPhase(hasPin ? 'verify' : 'new1'); setError(null); setSuccess(null) }
  const startRemove = () => { setAction('remove'); setPhase('verify'); setError(null); setSuccess(null) }
  const cancel = () => { setPhase('idle'); setError(null); setPendingNew('') }

  const onVerify = async (pin: string) => {
    const hash = await hashPin(userId, pin)
    if (hash !== getHash(userId)) { setError('Wrong PIN'); return }
    setError(null)
    if (action === 'remove') { setPhase('removing') } else { setPhase('new1') }
  }

  const onNew1 = (pin: string) => { setPendingNew(pin); setPhase('new2'); setError(null) }

  const onNew2 = async (pin: string) => {
    if (pin !== pendingNew) { setError('PINs don\'t match'); setPhase('new1'); setPendingNew(''); return }
    const hash = await hashPin(userId, pin)
    setHash(userId, hash)
    setHasPin(true)
    setSuccess('PIN set successfully')
    setPhase('idle')
  }

  const confirmRemove = () => {
    clearHash(userId)
    setHasPin(false)
    setSuccess('PIN removed')
    setPhase('idle')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">App PIN</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {hasPin ? 'PIN set — required on every session' : 'No PIN set — anyone with device access can open the app'}
          </p>
        </div>
        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full border', hasPin ? 'border-emerald-700/50 bg-emerald-950/40 text-emerald-400' : 'border-amber-700/50 bg-amber-950/30 text-amber-400')}>
          {hasPin ? '● Enabled' : '○ Disabled'}
        </span>
      </div>

      {success && (
        <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2">{success}</p>
      )}

      {phase === 'idle' && (
        <div className="flex gap-2">
          <button onClick={startChange} className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
            {hasPin ? 'Change PIN' : 'Set PIN'}
          </button>
          {hasPin && (
            <button onClick={startRemove} className="px-4 py-2 text-xs font-semibold rounded-lg border border-red-800/50 text-red-400 hover:bg-red-950/30 transition-colors">
              Remove PIN
            </button>
          )}
        </div>
      )}

      {phase !== 'idle' && phase !== 'removing' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          {phase === 'verify' && <MiniPad title={action === 'remove' ? 'Enter current PIN to confirm removal' : 'Enter current PIN'} onComplete={onVerify} error={error} />}
          {phase === 'new1'  && <MiniPad title="Enter new PIN" onComplete={onNew1} error={error} />}
          {phase === 'new2'  && <MiniPad title="Confirm new PIN" onComplete={onNew2} error={error} />}
          <button onClick={cancel} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Cancel</button>
        </div>
      )}

      {phase === 'removing' && (
        <div className="bg-red-950/20 border border-red-800/40 rounded-xl p-4 space-y-3">
          <p className="text-sm text-red-300">Remove PIN? The app will be accessible without authentication.</p>
          <div className="flex gap-2">
            <button onClick={confirmRemove} className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-600 text-white transition-colors">Remove</button>
            <button onClick={cancel} className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
