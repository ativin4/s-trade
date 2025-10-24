import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getProviders, type ClientSafeProvider } from 'next-auth/react'
import { authOptions } from '@/lib/auth'
import { WelcomeScreen } from '@/components/welcome-screen'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const providers: ClientSafeProvider[] = authOptions.providers.map(provider => ({ id: provider.id, name: provider.name, type: provider.type, signinUrl: '', callbackUrl: '' }))

  if (session) {
    redirect('/dashboard')
  }

  return <WelcomeScreen providers={providers} />
}