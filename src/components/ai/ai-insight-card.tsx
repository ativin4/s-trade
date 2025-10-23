import type { AIAnalysisResponse } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AIInsightCardProps {
  analysis: AIAnalysisResponse
  onAccept: () => void
  onReject: () => void
}

export function AIInsightCard({ analysis, onAccept, onReject }: AIInsightCardProps) {
  const getRecommendationClass = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_BUY':
      case 'BUY':
        return 'bg-bull-500'
      case 'STRONG_SELL':
      case 'SELL':
        return 'bg-bear-500'
      default:
        return 'bg-muted-foreground'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{analysis.symbol}</CardTitle>
          <Badge className={cn(getRecommendationClass(analysis.recommendation), 'text-white')}>
            {analysis.recommendation.replace('_', ' ')}
          </Badge>
        </div>
        <CardDescription>Confidence: {analysis.confidence}%</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{analysis.reasoning}</p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={onReject}>Reject</Button>
          <Button size="sm" onClick={onAccept}>Accept</Button>
        </div>
      </CardContent>
    </Card>
  )
}