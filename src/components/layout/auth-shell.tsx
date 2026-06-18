import { AppNav } from './app-nav'

interface AuthShellProps {
  children: React.ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-slate-950">
      <AppNav />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {children}
      </main>
    </div>
  )
}
