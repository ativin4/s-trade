import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Section Skeleton */}
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="w-48 h-6 bg-gray-200 rounded"></div>
          <div className="w-64 h-4 mt-2 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="w-16 h-4 mt-2 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="w-32 h-5 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="w-24 h-5 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="w-24 h-5 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
