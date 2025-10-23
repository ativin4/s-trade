'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export function InsightFilters() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insight Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="filter-recommendation">Recommendation</Label>
          <Select>
            <SelectTrigger id="filter-recommendation">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
              <SelectItem value="hold">Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="filter-confidence">Min. Confidence</Label>
          <Select>
            <SelectTrigger id="filter-confidence">
              <SelectValue placeholder="50%" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="60">60%</SelectItem>
              <SelectItem value="70">70%</SelectItem>
              <SelectItem value="80">80%</SelectItem>
              <SelectItem value="90">90%</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="filter-portfolio" />
          <Label htmlFor="filter-portfolio">In Portfolio</Label>
        </div>
      </CardContent>
    </Card>
  )
}