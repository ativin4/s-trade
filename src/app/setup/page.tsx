import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/auth'
import { TradingPreferencesForm } from '@/components/setup/trading-preferences-form'
import { OtpSetupForm } from '@/components/setup/otp-setup-form'
import { RiskManagementForm } from '@/components/setup/risk-management-form'
import { NotificationSettings } from '@/components/setup/notification-settings'
import { BrokerPreferences } from '@/components/setup/broker-preferences'
import { AccountSettings } from '@/components/setup/account-settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Shield, 
  Bell, 
  CreditCard, 
  User, 
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Save
} from 'lucide-react'
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
            <Settings className="w-8 h-8 text-purple-600" />
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

    return (
      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="preferences">
            <CreditCard className="w-4 h-4 mr-2" />
            Trading
          </TabsTrigger>
          <TabsTrigger value="risk">
            <Shield className="w-4 h-4 mr-2" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="otp">
            <Smartphone className="w-4 h-4 mr-2" />
            OTP Setup
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="brokers">
            <Settings className="w-4 h-4 mr-2" />
            Brokers
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Trading Preferences
              </CardTitle>
              <CardDescription>
                Set your default trading parameters and investment preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TradingPreferencesForm 
                userId={userId}
                initialSettings={userSettings}
              />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Max Budget Per Trade</p>
                    <p className="text-xl font-bold">
                      ₹{userSettings?.maxBudgetPerTrade?.toLocaleString('en-IN') || '50,000'}
                    </p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Risk Tolerance</p>
                    <p className="text-xl font-bold">{userSettings?.riskTolerance || 'Moderate'}</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Auto Trading</p>
                    <p className="text-xl font-bold">
                      {userSettings?.autoTradingEnabled ? (
                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </p>
                  </div>
                  <Settings className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Risk Management
              </CardTitle>
              <CardDescription>
                Configure position limits, stop-loss settings, and risk controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RiskManagementForm 
                userId={userId}
                initialSettings={userSettings}
              />
            </CardContent>
          </Card>

          {/* Risk Warnings */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="w-5 h-5" />
                Important Risk Disclosures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-orange-800">
                <p>
                  <strong>Trading Risk:</strong> All trading involves risk of substantial losses. 
                  Past performance does not guarantee future results.
                </p>
                <p>
                  <strong>Automated Trading:</strong> Automated systems may fail and result in 
                  unintended trades. Always monitor your positions.
                </p>
                <p>
                  <strong>Market Risk:</strong> Market conditions can change rapidly and may 
                  result in significant losses.
                </p>
                <p>
                  <strong>Technology Risk:</strong> System failures, connectivity issues, or 
                  software bugs may prevent order execution.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="otp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                OTP Setup for Sell Orders
              </CardTitle>
              <CardDescription>
                Configure OTP handling for automated sell order execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OTPSetupForm 
                userId={userId}
                initialSettings={userSettings}
              />
            </CardContent>
          </Card>

          {/* OTP Methods Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email OTP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Gmail API integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Automatic parsing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Most reliable</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">SMS OTP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Android support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">Requires permissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">Limited reliability</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">iMessage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">iOS support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">Requires macOS app</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">Complex setup</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure alerts for trades, price movements, and AI insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brokers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Broker Preferences
              </CardTitle>
              <CardDescription>
                Set default broker for trades and manage connection priorities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrokerPreferences 
                userId={userId}
                brokerAccounts={brokerAccounts as BrokerAccount[]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your profile information and account preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountSettings user={user} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    )
  } catch (error) {
    console.error('Setup page error:', error)
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
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