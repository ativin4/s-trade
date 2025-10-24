import { prisma } from '@/lib/auth'
import { BrokerConnectionCard } from '@/components/brokers/broker-connection-card'
import { PortfolioSyncStatus } from '@/components/brokers/portfolio-sync-status'
import { AddBrokerDialog } from '@/components/brokers/add-broker-dialog'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import { Button } from '@/components/ui/button'
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import type { BrokerAccount, BrokerName } from '@/types'
import { mapPrismaToAppAccount } from '@/lib/broker'


export default async function BrokersPage() {
  return (
    <PageWrapper>
      <PageHeader
        title="Broker Accounts"
        description="Manage your trading account connections and portfolio sync"
      >
        <AddBrokerDialog>
          <Button startIcon={<AddIcon />}>
            Connect Broker
          </Button>
        </AddBrokerDialog>
      </PageHeader>
      <BrokersContent />
    </PageWrapper>
  );
}


async function BrokersContent() {
  // The PageWrapper ensures session exists.
  const session = (await (await import('next-auth')).getServerSession((await import('@/lib/auth')).authOptions))!;
  const sessionUser = (session as { user?: { id?: string } }).user;
  if (!sessionUser || !sessionUser.id) throw new Error('No session user');
  const userId = sessionUser.id;

  const prismaAccounts = await prisma.brokerAccount.findMany({
    where: { userId },
  })

  const brokerAccounts = prismaAccounts.map(mapPrismaToAppAccount);

  const supportedBrokers: Array<{
    name: BrokerName
    displayName: string
    description: string
    features: string[]
    status: 'available' | 'coming_soon' | 'beta'
    logo: string
  }> = [
    {
      name: '5paisa',
      displayName: '5paisa',
      description: 'Ultra-fast trading with advanced APIs and comprehensive market data',
      features: ['Real-time data', 'Options trading', 'Margin trading', 'API support'],
      status: 'available',
      logo: '5️⃣'
    },
    {
      name: 'zerodha',
      displayName: 'Zerodha',
      description: "India's largest broker with Kite Connect API integration",
      features: ['Kite Connect API', 'Low brokerage', 'Advanced charts', 'Algo trading'],
      status: 'available',
      logo: '🔶'
    },
    {
      name: 'groww',
      displayName: 'Groww',
      description: 'Simple and modern trading platform with comprehensive tools',
      features: ['User-friendly', 'MF & Stocks', 'Research reports', 'Mobile-first'],
      status: 'beta',
      logo: '🌱'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Connected Accounts */}
      {brokerAccounts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brokerAccounts.map((account: BrokerAccount) => (
              <BrokerConnectionCard
                key={account.id}
                account={account}
              />
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Sync Status */}
      <PortfolioSyncStatus brokerAccounts={brokerAccounts as BrokerAccount[]} />

      {/* Available Brokers */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Brokers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supportedBrokers.map((broker) => {
            const isConnected = brokerAccounts.some(
              (account: BrokerAccount) => account.brokerName === broker.name
            )

            return (
              <Card key={broker.name} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{broker.logo}</span>
                      <div>
                        <Typography variant='h6'>{broker.displayName}</Typography>
                        <div className="flex items-center gap-2 mt-1">
                          {isConnected ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircleIcon sx={{ width: 12, height: 12 }} />
                              <span className="text-xs font-medium">Connected</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-gray-400">
                              <CancelIcon sx={{ width: 12, height: 12 }} />
                              <span className="text-xs">Not connected</span>
                            </div>
                          )}
                          {broker.status === 'beta' && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                              Beta
                            </span>
                          )}
                          {broker.status === 'coming_soon' && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              Coming Soon
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Typography variant='body2'>
                    {broker.description}
                  </Typography>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {broker.features.map((feature) => (
                          <span
                            key={feature}
                            className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {broker.status === 'available' && (
                      <div className="pt-2">
                        {isConnected ? (
                          <Button variant="outlined" size="small" className="w-full">
                            Manage Connection
                          </Button>
                        ) : (
                          <AddBrokerDialog brokerName={broker.name}>
                            <Button size="small" className="w-full">
                              Connect {broker.displayName}
                            </Button>
                          </AddBrokerDialog>
                        )}
                      </div>
                    )}

                    {broker.status === 'coming_soon' && (
                      <Button variant="outlined" size="small" className="w-full" disabled>
                        Coming Soon
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <InfoIcon className="text-blue-600" />
            <Typography variant="h6" className="text-blue-900">
              Need Help Connecting?
            </Typography>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              To connect your broker account, you'll need your API credentials:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>5paisa:</strong> API Key and Secret from your 5paisa account</li>
              <li><strong>Zerodha:</strong> API Key and Secret from Kite Connect</li>
              <li><strong>Groww:</strong> API credentials from Groww developer portal</li>
            </ul>
            <p className="mt-3">
              All credentials are encrypted and stored securely. We never store your 
              trading passwords.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function BrokersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded mt-1"></div>
                </div>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="w-20 h-3 bg-gray-200 rounded"></div>
                <div className="flex gap-1">
                  <div className="w-16 h-5 bg-gray-200 rounded"></div>
                  <div className="w-20 h-5 bg-gray-200 rounded"></div>
                </div>
                <div className="w-full h-8 bg-gray-200 rounded mt-3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}