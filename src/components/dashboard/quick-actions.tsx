import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import { Card, CardContent } from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import Link from 'next/link'

export function QuickActions({ brokerAccounts }: { brokerAccounts: any[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <Link href="/trade" className="text-center">
            <SearchIcon className="w-8 h-8 mx-auto text-blue-600" />
            <p className="mt-2 text-sm font-medium">Search & Trade</p>
          </Link>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <Link href="/brokers" className="text-center">
            <BusinessCenterIcon className="w-8 h-8 mx-auto text-green-600" />
            <p className="mt-2 text-sm font-medium">Manage Brokers</p>
          </Link>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <Link href="/insights" className="text-center">
            <AddIcon className="w-8 h-8 mx-auto text-purple-600" />
            <p className="mt-2 text-sm font-medium">AI Insights</p>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
