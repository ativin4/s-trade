import { PrismaClient } from '@prisma/client'
import { mapPrismaToAppAccount } from '/Users/ativin/Desktop/Projects/s-trade/src/lib/broker'
import { getGrowwHoldings } from '/Users/ativin/Desktop/Projects/s-trade/src/lib/services/groww'

const prisma = new PrismaClient()

async function main() {
  const accounts = await prisma.brokerAccount.findMany({
    where: { isActive: true },
  })
  
  const mapped = accounts.map(mapPrismaToAppAccount)
  const growwAcc = mapped.find(a => a.brokerName === 'groww')
  if (growwAcc) {
    console.log("Found Groww account, clientCode is:", growwAcc.clientCode === 'mcp://groww.in' ? 'MCP' : 'API')
    try {
      const h = await getGrowwHoldings(growwAcc)
      console.log('Groww holdings:', h)
    } catch(err) {
      console.log('Groww error:', err.message)
    }
  }

}

main().finally(() => prisma.$disconnect())
