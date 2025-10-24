'use client'

import { useState } from 'react'
import { Tabs, Tab, TabPanel } from '@/components/ui/tabs'
import { StockSearch } from '@/components/trading/stock-search'
import { TradingPanel } from '@/components/trading/trading-panel'
import { OrderBook } from '@/components/trading/order-book'
import { StockChart } from '@/components/trading/stock-chart'
import { TradeHistory } from '@/components/trading/trade-history'
import { MarketDepth } from '@/components/trading/market-depth'
import { Card, CardContent, CardHeader} from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SearchIcon from '@mui/icons-material/Search';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import type { BrokerAccount, Trade, UserSettings } from '@/types'

interface TradeClientProps {
  userId: string;
  user: any;
  brokerAccounts: BrokerAccount[];
  recentTrades: (Trade & { brokerAccount: { brokerName: string } })[];
  gainers: any[];
  losers: any[];
}

export function TradeClient({ userId, user, brokerAccounts, recentTrades, gainers, losers }: TradeClientProps) {
    const [value, setValue] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <div className="lg:col-span-3">
            <Tabs value={value} onChange={handleChange} aria-label="trade tabs">
                <Tab label="Search & Trade" icon={<SearchIcon />} />
                <Tab label="Charts" icon={<BarChartIcon />} />
                <Tab label="Order Book" icon={<MyLocationIcon />} />
                <Tab label="History" icon={<HistoryIcon />} />
            </Tabs>
            <TabPanel value={value} index={0}>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <Typography variant='h6'>Search Stocks</Typography>
                            <Typography variant='body2'>
                                Search for stocks and view real-time prices
                            </Typography>
                        </CardHeader>
                        <CardContent>
                            <StockSearch />
                        </CardContent>
                    </Card>

                    <TradingPanel
                        brokerAccounts={brokerAccounts as BrokerAccount[]}
                        userSettings={user.settings}
                    />

                    <Card>
                        <CardHeader>
                            <Typography variant='h6'>Market Movers</Typography>
                            <Typography variant='body2'>Top gainers and losers today</Typography>
                        </CardHeader>
                        <CardContent>
                            <MarketMovers gainers={gainers} losers={losers} />
                        </CardContent>
                    </Card>
                </div>
            </TabPanel>
            <TabPanel value={value} index={1}>
                <Card>
                    <CardHeader>
                        <Typography variant='h6'>Stock Chart</Typography>
                        <Typography variant='body2'>
                            Interactive price charts with technical indicators
                        </Typography>
                    </CardHeader>
                    <CardContent>
                        <StockChart symbol="RELIANCE.NS" height={400} />
                    </CardContent>
                </Card>
            </TabPanel>
            <TabPanel value={value} index={2}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <OrderBook symbol="RELIANCE.NS" />
                    <MarketDepth symbol="RELIANCE.NS" />
                </div>
            </TabPanel>
            <TabPanel value={value} index={3}>
                <TradeHistory trades={recentTrades} />
            </TabPanel>
        </div>
    )
}

function MarketMovers({ gainers, losers }: {
  gainers: Array<{ symbol: string; name: string; price: number; change: number; changePercent: number }>
  losers: Array<{ symbol: string; name: string; price: number; change: number; changePercent: number }>
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-medium text-bull-500 mb-3 flex items-center gap-2">
          <TrendingUpIcon className="w-4 h-4" />
          Top Gainers
        </h3>
        <div className="space-y-2">
          {gainers.map(stock => (
            <div key={stock.symbol} className="flex items-center justify-between p-2 bg-bull-500/10 rounded">
              <div>
                <p className="font-medium text-sm">{stock.symbol}</p>
                <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{stock.price}</p>
                <p className="text-sm text-bull-500">+{stock.changePercent}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-bear-500 mb-3 flex items-center gap-2">
          <TrendingDownIcon className="w-4 h-4" />
          Top Losers
        </h3>
        <div className="space-y-2">
          {losers.map(stock => (
            <div key={stock.symbol} className="flex items-center justify-between p-2 bg-bear-500/10 rounded">
              <div>
                <p className="font-medium text-sm">{stock.symbol}</p>
                <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{stock.price}</p>
                <p className="text-sm text-bear-500">{stock.changePercent}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
