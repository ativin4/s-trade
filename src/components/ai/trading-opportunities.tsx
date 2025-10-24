import type { TradingSuggestion, RiskTolerance } from '@/app/types'
import { Card, CardContent, CardHeader} from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import { Button } from '@/components/ui/button'

interface TradingOpportunitiesProps {
  suggestions: TradingSuggestion[]
  budget: number
  riskTolerance: RiskTolerance
}

export function TradingOpportunities({ suggestions, budget, riskTolerance }: TradingOpportunitiesProps) {
  return (
    <Card>
      <CardHeader>
        <Typography variant='h6'>Trading Opportunities</Typography>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Budget: ₹{budget.toLocaleString('en-IN')}</span>
            <span>Risk Tolerance: {riskTolerance}</span>
          </div>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold">{suggestion.symbol}</p>
                  <p className="text-sm">{suggestion.action} @ ₹{suggestion.price.toLocaleString('en-IN')}</p>
                </div>
                <Button size="small">Trade</Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}