import { Suspense, type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface PageWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export async function PageWrapper({ children, fallback }: PageWrapperProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  )
}