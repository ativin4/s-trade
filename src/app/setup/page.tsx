import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/auth'
import { SetupClient } from './setup-client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import SettingsIcon from '@mui/icons-material/Settings';
import WarningIcon from '@mui/icons-material/Warning';
import type { UserSettings, BrokerAccount } from '@/types'

export default async function SetupPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-purple-600" />
            Settings & Preferences
          </h1>
          <p className="text-gray-600 mt-1">
            Configure your trading preferences and security settings
          </p>
        </div>
      </div>

      <Suspense fallback={<SetupSkeleton />}>
        <SetupContent userId={session.user.id} />
      </Suspense>
    </div>
  )
}

interface SetupContentProps {
  userId: string
}

async function SetupContent({ userId }: SetupContentProps) {
  try {
    // Fetch user data, settings, and broker accounts
    const [user, userSettings, brokerAccounts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId }
      }),
      prisma.userSettings.findUnique({
        where: { userId }
      }),
      prisma.brokerAccount.findMany({
        where: { userId }
      })
    ])

    if (!user) {
      redirect('/auth/signin')
    }

    return <SetupClient userId={userId} user={user} userSettings={userSettings as UserSettings} brokerAccounts={brokerAccounts as BrokerAccount[]} />
  } catch (error) {
    console.error('Setup page error:', error)
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <WarningIcon className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">Unable to Load Settings</h3>
              <p className="text-sm text-red-700 mt-1">
                There was an error loading your settings. Please try again later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
}

function SetupSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
      
      <Card className="animate-pulse">
        <CardHeader>
          <div className="w-48 h-6 bg-gray-200 rounded"></div>
          <div className="w-64 h-4 bg-gray-200 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full h-10 bg-gray-200 rounded"></div>
            <div className="w-3/4 h-10 bg-gray-200 rounded"></div>
            <div className="w-1/2 h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="w-24 h-3 bg-gray-200 rounded"></div>
                  <div className="w-16 h-5 bg-gray-200 rounded"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
