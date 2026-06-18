'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Menu, MenuItem } from '@mui/material'
import { cn } from '@/lib/utils'
import { IndicesStrip } from './indices-strip'
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
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 text-white font-bold text-lg">
          <Image src="/icon.svg" alt="" width={28} height={28} className="rounded-md" />
          S-Trade
        </Link>

        {/* Live indices */}
        <IndicesStrip />

        {/* Nav links */}
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
          <div>
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

      {/* Mobile nav */}
      <nav className="md:hidden flex overflow-x-auto border-t border-slate-800 px-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap font-medium border-b-2 transition-colors',
                active
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-white'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
