import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-sm text-slate-400 mt-0.5">{description}</p>
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  )
}