import type { AIAnalysisResponse } from '@/types'
import { Card, CardContent, CardHeader} from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
          <Typography variant='h6'>{analysis.symbol}</Typography>
          <Badge sx={{ backgroundColor: getRecommendationClass(analysis.recommendation) }} color="primary" label={analysis.recommendation.replace('_', ' ')} />
        </div>
        <Typography variant='body2'>Confidence: {analysis.confidence}%</Typography>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{analysis.reasoning}</p>
        <div className="flex justify-end space-x-2">
          <Button variant="outlined" size="small" onClick={onReject}>Reject</Button>
          <Button size="small" onClick={onAccept}>Accept</Button>
        </div>
      </CardContent>
    </Card>
  )
}