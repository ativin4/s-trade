'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Menu, MenuItem } from '@mui/material'
import { cn } from '@/lib/utils'
import { IndicesStrip } from './indices-strip'
import { useMarketStream } from '@/hooks/use-market-stream'
import { Avatar } from '@/components/ui/avatar'
import Image from 'next/image'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import LinkIcon from '@mui/icons-material/Link'
import SettingsIcon from '@mui/icons-material/Settings'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
  { href: '/trade', label: 'Trade', icon: <ShowChartIcon fontSize="small" /> },
  { href: '/brokers', label: 'Brokers', icon: <LinkIcon fontSize="small" /> },
  { href: '/insights', label: 'Insights', icon: <LightbulbIcon fontSize="small" /> },
  { href: '/setup', label: 'Settings', icon: <SettingsIcon fontSize="small" /> },
]

export function AppNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 text-white font-bold text-lg flex-shrink-0">
            <Image src="/icon.svg" alt="" width={28} height={28} className="rounded-md" />
            <span className="hidden sm:inline">S-Trade</span>
          </Link>

          {/* Live indices */}
          <IndicesStrip />

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User menu */}
          {session && (
            <div className="flex-shrink-0">
              <button onClick={(e) => setAnchorEl(e.currentTarget)} className="flex items-center gap-2">
                <Avatar
                  src={session.user?.image ?? ''}
                  alt={session.user?.name ?? ''}
                  sx={{ width: 32, height: 32 }}
                >
                  {session.user?.name?.[0]}
                </Avatar>
              </button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                slotProps={{
                  paper: {
                    sx: { backgroundColor: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' }
                  }
                }}
              >
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-white">{session.user?.name}</p>
                  <p className="text-xs text-slate-400">{session.user?.email}</p>
                </div>
                <hr className="border-slate-700" />
                <MenuItem
                  onClick={() => { setAnchorEl(null); signOut({ callbackUrl: '/' }) }}
                  sx={{ color: '#94a3b8', fontSize: 14, '&:hover': { color: '#f1f5f9' } }}
                >
                  Sign out
                </MenuItem>
              </Menu>
            </div>
          )}
        </div>

        {/* Mobile indices row */}
        <MobileIndices />
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/98 backdrop-blur border-t border-slate-800" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-14">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[44px] rounded-xl transition-colors',
                  active ? 'text-blue-400' : 'text-slate-500'
                )}
              >
                <span className="[&>svg]:w-5 [&>svg]:h-5">{item.icon}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wide">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

function MobileIndices() {
  const { data, stale } = useMarketStream(['NIFTY', 'SENSEX', 'BANKNIFTY'])
  const items = [
    { key: 'NIFTY',     label: 'NIFTY' },
    { key: 'SENSEX',   label: 'SENSEX' },
    { key: 'BANKNIFTY', label: 'BANK N.' },
  ]
  return (
    <div className="md:hidden flex gap-0 border-t border-slate-800/60 overflow-x-auto scrollbar-none">
      {items.map(({ key, label }) => {
        const d = data[key]
        const up = (d?.changePercent ?? 0) >= 0
        return (
          <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 border-r border-slate-800/40 flex-shrink-0">
            <span className="text-[10px] text-slate-500 font-medium">{label}</span>
            {d ? (
              <>
                <span className="text-[11px] font-bold tabular-nums text-white">
                  {d.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className={cn('text-[10px] font-semibold', up ? 'text-emerald-400' : 'text-red-400')}>
                  {up ? '+' : ''}{d.changePercent.toFixed(2)}%
                </span>
              </>
            ) : (
              <span className={cn('text-[11px] text-slate-600', stale ? '' : 'animate-pulse')}>—</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
