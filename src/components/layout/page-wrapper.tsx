import { Suspense, type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AuthShell } from './auth-shell'

interface PageWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  /** Set to true when the parent already renders AuthShell (e.g. dashboard) */
  bare?: boolean
}

export async function PageWrapper({ children, fallback, bare }: PageWrapperProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/')
  }

  if (bare) {
    return (
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    )
  }

  return (
    <AuthShell>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </AuthShell>
  )
}