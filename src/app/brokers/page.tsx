import { prisma } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { ConnectBrokerButton } from '@/components/brokers/connect-broker-button'
import { mapPrismaToAppAccount } from '@/lib/broker'
import { BrokersUI } from '@/components/brokers/brokers-ui'

export default async function BrokersPage() {
  const session = await getServerSession(authOptions)
  const userId = (session as { user?: { id?: string } } | null)?.user?.id
  if (!userId) redirect('/')

  let brokerAccounts: ReturnType<typeof mapPrismaToAppAccount>[] = []
  try {
    const prismaAccounts = await prisma.brokerAccount.findMany({ where: { userId } })
    brokerAccounts = prismaAccounts.map(mapPrismaToAppAccount)
  } catch (err) {
    console.error('Brokers page error:', err)
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Broker Accounts"
        description="Manage your trading account connections and portfolio sync"
      >
        <ConnectBrokerButton />
      </PageHeader>
      <BrokersUI brokerAccounts={brokerAccounts} />
    </PageWrapper>
  )
}
