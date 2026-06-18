import Link from 'next/link'

const ACTIONS = [
  { href: '/trade',    label: 'Trade',    color: 'text-blue-400 hover:text-blue-300'     },
  { href: '/insights', label: 'Insights', color: 'text-violet-400 hover:text-violet-300' },
  { href: '/brokers',  label: 'Brokers',  color: 'text-emerald-400 hover:text-emerald-300' },
] as const

export function QuickActions() {
  return (
    <div className="hidden sm:flex items-center gap-1">
      {ACTIONS.map(a => (
        <Link
          key={a.href}
          href={a.href}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 transition-colors ${a.color}`}
        >
          {a.label}
        </Link>
      ))}
    </div>
  )
}
