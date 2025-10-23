import type { ReactNode } from 'react'
import { UserNav } from './user-nav'

interface PageHeaderProps {
  title: string
  description: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-card border-b">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="flex items-center space-x-4">
        {children}
        <UserNav />
      </div>
    </div>
  )
}