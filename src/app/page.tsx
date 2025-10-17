import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getProviders } from 'next-auth/react'
import { authOptions } from '@/lib/auth'
import { WelcomeScreen } from '@/components/welcome-screen'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const providers = (await getProviders()) ?? {}

  if (session) {
    redirect('/dashboard')
  }

  return <WelcomeScreen providers={providers} />
}