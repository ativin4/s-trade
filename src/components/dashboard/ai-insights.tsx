import type { AIAnalysisResponse, UserSettings } from '@/app/types'
import { Card, CardContent, CardHeader} from '@/components/ui/card'
import Typography from '@mui/material/Typography'

interface AIInsightsProps {
  insights: AIAnalysisResponse[]
  userPreferences: UserSettings | null
}

export function AIInsights({ insights, userPreferences }: AIInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <Typography variant='h6'>AI Insights</Typography>
      </CardHeader>
      <CardContent>
        {insights.length > 0 ? (
          <ul className="space-y-4">
            {insights.map((insight, index) => (
              <li key={index} className="p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold">{insight.symbol}</p>
                <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                <p className="text-xs mt-2">Confidence: {insight.confidence}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No AI insights available at the moment.</p>
        )}
      </CardContent>
    </Card>
  )
}