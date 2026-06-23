import { PrismaClient } from '@prisma/client'
import { safeDecrypt } from '/Users/ativin/Desktop/Projects/s-trade/src/lib/crypto'

const prisma = new PrismaClient()

async function main() {
  const accounts = await prisma.brokerAccount.findMany({
    where: { isActive: true },
  })
  
  for (const acc of accounts) {
    if (acc.brokerName === 'groww') {
      console.log('Groww clientCode:', safeDecrypt(acc.clientCode) || acc.clientCode)
      console.log('Groww totpSecret:', safeDecrypt(acc.totpSecret))
    }
    if (acc.brokerName === '5paisa') {
      const extra = safeDecrypt(acc.extraCredentials)
      console.log('5paisa extra:', extra)
    }
  }
}

main().finally(() => prisma.$disconnect())
