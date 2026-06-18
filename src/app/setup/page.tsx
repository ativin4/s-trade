import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/auth'
import { SetupClient } from './setup-client'
import { PageWrapper } from '@/components/layout/page-wrapper'
import type { UserSettings, BrokerAccount } from '@/app/types'
export default async function SetupPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/')

  return (
    <PageWrapper>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold text-white">⚙ Settings & Preferences</h1>
      </div>
      <p className="text-slate-400 mb-6">Configure your trading preferences and security settings</p>
      <Suspense fallback={<SetupSkeleton />}>
        <SetupContent userId={session.user.id} />
      </Suspense>
    </PageWrapper>
  )
}

async function SetupContent({ userId }: { userId: string }) {
  try {
    const [user, userSettings, brokerAccounts] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.userSettings.findUnique({ where: { userId } }),
      prisma.brokerAccount.findMany({ where: { userId } }),
    ])
    if (!user) redirect('/')

    return (
      <SetupClient
        userId={userId}
        user={user}
        userSettings={userSettings as UserSettings}
        brokerAccounts={brokerAccounts as BrokerAccount[]}
      />
    )
  } catch (err) {
    console.error('Setup page error:', err)
    return (
      <div className="bg-red-950/30 border border-red-800 rounded-xl p-6">
        <p className="text-red-400 font-medium">Unable to load settings</p>
        <p className="text-red-500/60 text-sm mt-1">Refresh or contact support if this persists.</p>
      </div>
    )
  }
}

function SetupSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="w-24 h-10 bg-slate-800 rounded" />
        ))}
      </div>
      <div className="h-48 bg-slate-800 rounded-lg" />
    </div>
  )
}
