import type { PortfolioHolding, AIAnalysisResponse } from '@/app/types'
import { Card, CardContent, CardHeader} from '@/components/ui/card'
import Typography from '@mui/material/Typography'

interface PortfolioAnalysisProps {
  holdings: PortfolioHolding[]
  analyses: AIAnalysisResponse[]
}

export function PortfolioAnalysis({ holdings, analyses }: PortfolioAnalysisProps) {
  return (
    <Card>
      <CardHeader>
        <Typography variant='h6'>Portfolio Analysis</Typography>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Holdings Overview</h3>
            <p className="text-sm text-muted-foreground">You have {holdings.length} holdings in your portfolio.</p>
          </div>
          <div>
            <h3 className="font-semibold">AI Recommendations</h3>
            <p className="text-sm text-muted-foreground">There are {analyses.length} AI recommendations for your holdings.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}