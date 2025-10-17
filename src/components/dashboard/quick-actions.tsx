import { Plus, Search, Briefcase } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function QuickActions({ brokerAccounts }: { brokerAccounts: any[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <Link href="/trade" className="text-center">
            <Search className="w-8 h-8 mx-auto text-blue-600" />
            <p className="mt-2 text-sm font-medium">Search & Trade</p>
          </Link>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <Link href="/brokers" className="text-center">
            <Briefcase className="w-8 h-8 mx-auto text-green-600" />
            <p className="mt-2 text-sm font-medium">Manage Brokers</p>
          </Link>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <Link href="/insights" className="text-center">
            <Plus className="w-8 h-8 mx-auto text-purple-600" />
            <p className="mt-2 text-sm font-medium">AI Insights</p>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
