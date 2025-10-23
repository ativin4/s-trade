import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getProviders } from 'next-auth/react'
import { authOptions } from '@/lib/auth'
import { WelcomeScreen } from '@/components/welcome-screen'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const providers = authOptions.providers.map(provider => ({ id: provider.id, name: provider.name }))

  if (session) {
    redirect('/dashboard')
  }

  return <WelcomeScreen providers={providers} />
}