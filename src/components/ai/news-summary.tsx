import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface NewsSummaryProps {
  summary: {
    summary: string
    keyPoints: string[]
    mentionedStocks: string[]
  }
}

export function NewsSummary({ summary }: NewsSummaryProps) {
  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI News Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No news summary available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI News Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{summary.summary}</p>
        <div className="space-y-2">
          <h4 className="font-medium">Key Points</h4>
          <ul className="list-disc list-inside text-muted-foreground">
            {summary.keyPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
        <div className="mt-4">
          <h4 className="font-medium">Mentioned Stocks</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {summary.mentionedStocks.map((stock, index) => (
              <Badge key={index} variant="secondary">{stock}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}