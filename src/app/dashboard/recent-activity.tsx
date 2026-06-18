import { prisma } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { fmtINR, fmtDate } from '@/lib/format'

export async function RecentActivity({ userId }: { userId: string }) {
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { brokerAccount: { select: { brokerName: true } } },
  })

  if (trades.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-slate-600">No trades yet</p>
        <p className="text-xs text-slate-700 mt-1">Your executed orders will appear here</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-800/50">
      {trades.map(t => (
        <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
          <div className="flex items-center gap-3">
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded border',
              t.tradeType === 'BUY'
                ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50'
                : 'text-red-400 bg-red-950/40 border-red-800/50'
            )}>
              {t.tradeType}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{t.symbol}</p>
              <p className="text-xs text-slate-500">{t.quantity} × {fmtINR(t.price)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-400 capitalize">{t.brokerAccount.brokerName}</p>
            <p className="text-[11px] text-slate-600">{fmtDate(t.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
