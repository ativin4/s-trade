import type { MarketSentiment } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MarketSentimentCardProps {
  sentiment: MarketSentiment
}

export function MarketSentimentCard({ sentiment }: MarketSentimentCardProps) {
  const getSentimentClass = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH':
        return 'bg-bull-500'
      case 'BEARISH':
        return 'bg-bear-500'
      default:
        return 'bg-muted-foreground'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Market Sentiment</CardTitle>
          <Badge className={cn(getSentimentClass(sentiment.sentiment), 'text-white')}>
            {sentiment.sentiment}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{sentiment.reasoning}</p>
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Key Factors:</h4>
          <div className="flex flex-wrap gap-2">
            {sentiment.factors.map((factor, index) => (
              <Badge key={index} variant="outline">{factor}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}