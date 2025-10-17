
import type { AIAnalysisResponse, UserSettings } from '@/app/types'

interface AIInsightsProps {
  insights: AIAnalysisResponse[]
  userPreferences: UserSettings | null
}

export function AIInsights({ insights, userPreferences }: AIInsightsProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h2>
      <p>Insights found: {insights.length}</p>
      {/* Add more detailed insights here */}
    </div>
  )
}
