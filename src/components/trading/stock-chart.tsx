
'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Card, CardContent, CardHeader} from '@/components/ui/card'
import Typography from '@mui/material/Typography'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface StockChartProps {
  symbol: string
  height?: number
}

export function StockChart({ symbol, height = 400 }: StockChartProps) {
  // TODO: Fetch real chart data
  const data = {
    labels: ['9:15', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00'],
    datasets: [
      {
        label: symbol,
        data: [2850, 2855, 2860, 2858, 2865, 2870, 2868],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <Typography variant='h6'>{symbol} Chart</Typography>
      </CardHeader>
      <CardContent style={{ height }}>
        <Line data={data} options={options} />
      </CardContent>
    </Card>
  )
}
