'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

const INACTIVITY_MS  = 5 * 60 * 1000   // lock after 5 min inactive
const BG_LOCK_MS     = 2 * 60 * 1000   // lock after 2 min in background
const MAX_ATTEMPTS   = 5

function pinHashKey(userId: string) { return `strade_pin_${userId}` }
const VERIFIED_KEY   = 'strade_pin_v'
const VERIFIED_AT    = 'strade_pin_vat'

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hashPin(userId: string, pin: string): Promise<string> {
  return sha256(`strade:${userId}:${pin}`)
}

function getStoredHash(userId: string) {
  try { return localStorage.getItem(pinHashKey(userId)) } catch { return null }
}
function setStoredHash(userId: string, hash: string) {
  try { localStorage.setItem(pinHashKey(userId), hash) } catch { /* */ }
}
function markVerified() {
  try {
    sessionStorage.setItem(VERIFIED_KEY, '1')
    sessionStorage.setItem(VERIFIED_AT, Date.now().toString())
  } catch { /* */ }
}
function clearVerified() {
  try { sessionStorage.removeItem(VERIFIED_KEY); sessionStorage.removeItem(VERIFIED_AT) } catch { /* */ }
}
function isVerified() {
  try { return sessionStorage.getItem(VERIFIED_KEY) === '1' } catch { return false }
}

// ── PIN pad ──────────────────────────────────────────────────────────────────

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

interface PinPadProps {
  title: string
  subtitle?: string
  onComplete: (pin: string) => void | Promise<void>
  error?: string | null
  attempts?: number
  maxAttempts?: number
  footer?: React.ReactNode
}

function PinPad({ title, subtitle, onComplete, error, attempts = 0, maxAttempts = MAX_ATTEMPTS, footer }: PinPadProps) {
  const [pin, setPin] = useState('')

  const press = useCallback((k: string) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return }
    if (k === '') return
    setPin(p => {
      const next = p + k
      if (next.length === 4) { onComplete(next); return '' }
      return next
    })
  }, [onComplete])

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') press(e.key)
      else if (e.key === 'Backspace') press('⌫')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [press])

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xs mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>

      {/* Dots */}
      <div className="flex gap-4">
        {[0,1,2,3].map(i => (
          <div key={i} className={cn(
            'w-4 h-4 rounded-full border-2 transition-all duration-150',
            i < pin.length ? 'bg-blue-400 border-blue-400 scale-110' : 'border-slate-600'
          )} />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-400 text-center">
          {error}
          {attempts > 0 && maxAttempts - attempts > 0 && (
            <span className="text-slate-500"> · {maxAttempts - attempts} left</span>
          )}
        </p>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {KEYS.map((k, i) => (
          <button
            key={i}
            onClick={() => press(k)}
            disabled={k === ''}
            className={cn(
              'h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95',
              k === '' ? 'invisible' :
              k === '⌫' ? 'bg-slate-800/60 text-slate-400 hover:bg-slate-700' :
              'bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-600'
            )}
          >
            {k}
          </button>
        ))}
      </div>

      {footer}
    </div>
  )
}

// ── Main gate ─────────────────────────────────────────────────────────────────

interface PinGateProps { children: React.ReactNode }

export function PinGate({ children }: PinGateProps) {
  const { data: session } = useSession()
  const userId = session?.user?.id ?? ''

  const [phase, setPhase]       = useState<'loading' | 'setup' | 'setup2' | 'verify' | 'open'>('loading')
  const [setupPin, setSetupPin] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hiddenAt      = useRef<number | null>(null)

  const lock = useCallback(() => {
    clearVerified()
    setPhase('verify')
    setError(null)
    setAttempts(0)
  }, [])

  // Reset inactivity timer on user interaction
  const resetInactivity = useCallback(() => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current)
    inactivityRef.current = setTimeout(lock, INACTIVITY_MS)
  }, [lock])

  useEffect(() => {
    if (!userId) return
    const hash = getStoredHash(userId)
    if (!hash) { setPhase('setup'); return }
    if (isVerified()) { setPhase('open'); return }
    setPhase('verify')
  }, [userId])

  // Inactivity + background lock
  useEffect(() => {
    if (phase !== 'open') return
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => document.addEventListener(e, resetInactivity, { passive: true }))
    resetInactivity()

    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now()
      } else {
        if (hiddenAt.current && Date.now() - hiddenAt.current > BG_LOCK_MS) lock()
        hiddenAt.current = null
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      if (inactivityRef.current) clearTimeout(inactivityRef.current)
      events.forEach(e => document.removeEventListener(e, resetInactivity))
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [phase, lock, resetInactivity])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const onSetupPin = (pin: string) => { setSetupPin(pin); setPhase('setup2') }

  const onConfirmPin = async (pin: string) => {
    if (pin !== setupPin) { setError('PINs don\'t match'); setPhase('setup'); setSetupPin(''); return }
    const hash = await hashPin(userId, pin)
    setStoredHash(userId, hash)
    markVerified()
    setPhase('open')
    setError(null)
  }

  const onVerify = async (pin: string) => {
    const hash = await hashPin(userId, pin)
    const stored = getStoredHash(userId)
    if (hash === stored) {
      markVerified()
      setPhase('open')
      setError(null)
      setAttempts(0)
    } else {
      const next = attempts + 1
      setAttempts(next)
      if (next >= MAX_ATTEMPTS) {
        clearVerified()
        signOut({ callbackUrl: '/' })
      } else {
        setError('Wrong PIN')
      }
    }
  }

  const resetPin = () => {
    try { localStorage.removeItem(pinHashKey(userId)) } catch { /* */ }
    clearVerified()
    signOut({ callbackUrl: '/' })
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (phase === 'loading') return null

  if (phase === 'open') return <>{children}</>

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center px-6" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Logo */}
      <div className="mb-10 flex items-center gap-2">
        <img src="/icon.svg" alt="" className="w-8 h-8 rounded-lg" />
        <span className="text-white font-bold text-xl">S-Trade</span>
      </div>

      {phase === 'setup' && (
        <PinPad
          title="Set up your PIN"
          subtitle="4-digit PIN to protect your account"
          onComplete={onSetupPin}
          error={error}
        />
      )}

      {phase === 'setup2' && (
        <PinPad
          title="Confirm your PIN"
          onComplete={onConfirmPin}
          error={error}
        />
      )}

      {phase === 'verify' && (
        <PinPad
          title="Enter PIN"
          subtitle={session?.user?.name ? `Welcome back, ${session.user.name.split(' ')[0]}` : undefined}
          onComplete={onVerify}
          error={error}
          attempts={attempts}
          maxAttempts={MAX_ATTEMPTS}
          footer={
            <button
              onClick={resetPin}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors mt-2"
            >
              Forgot PIN? Sign out
            </button>
          }
        />
      )}
    </div>
  )
}
