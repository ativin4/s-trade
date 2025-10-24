'use client'

import { useState } from 'react'
import { Tabs, Tab, TabPanel } from '@/components/ui/tabs'
import { TradingPreferencesForm } from '@/components/setup/trading-preferences-form'
import { OtpSetupForm } from '@/components/setup/otp-setup-form'
import { RiskManagementForm } from '@/components/setup/risk-management-form'
import { NotificationSettings } from '@/components/setup/notification-settings'
import { BrokerPreferences } from '@/components/setup/broker-preferences'
import { AccountSettings } from '@/components/setup/account-settings'
import { Card, CardContent, CardHeader} from '@/components/ui/card'
import Typography from '@mui/material/Typography'
import { Badge } from '@/components/ui/badge'
import SettingsIcon from '@mui/icons-material/Settings';
import ShieldIcon from '@mui/icons-material/Shield';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { UserSettings, BrokerAccount } from '@/types'

interface SetupClientProps {
  userId: string;
  user: any;
  userSettings: UserSettings | null;
  brokerAccounts: BrokerAccount[];
}

export function SetupClient({ userId, user, userSettings, brokerAccounts }: SetupClientProps) {
    const [value, setValue] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <div className="space-y-6">
            <Tabs value={value} onChange={handleChange} aria-label="setup tabs">
                <Tab label="Trading" icon={<CreditCardIcon />} />
                <Tab label="Risk" icon={<ShieldIcon />} />
                <Tab label="OTP Setup" icon={<SmartphoneIcon />} />
                <Tab label="Notifications" icon={<NotificationsIcon />} />
                <Tab label="Brokers" icon={<SettingsIcon />} />
                <Tab label="Account" icon={<PersonIcon />} />
            </Tabs>
            <TabPanel value={value} index={0}>
                <Card>
                    <CardHeader>
                        <Typography variant='h6' className="flex items-center gap-2">
                            <CreditCardIcon />
                            Trading Preferences
                        </Typography>
                        <Typography variant='body2'>
                            Set your default trading parameters and investment preferences
                        </Typography>
                    </CardHeader>
                    <CardContent>
                        <TradingPreferencesForm 
                            userId={userId}
                            initialSettings={userSettings}
                        />
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Max Budget Per Trade</p>
                                    <p className="text-xl font-bold">
                                        ₹{userSettings?.maxBudgetPerTrade?.toLocaleString('en-IN') || '50,000'}
                                    </p>
                                </div>
                                <CreditCardIcon className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Risk Tolerance</p>
                                    <p className="text-xl font-bold">{userSettings?.riskTolerance || 'Moderate'}</p>
                                </div>
                                <ShieldIcon className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Auto Trading</p>
                                    <p className="text-xl font-bold">
                                        {userSettings?.autoTradingEnabled ? (
                                            <Badge color="success" label="Enabled" />
                                        ) : (
                                            <Badge color="secondary" label="Disabled" />
                                        )}
                                    </p>
                                </div>
                                <SettingsIcon className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabPanel>
            <TabPanel value={value} index={1}>
                <Card>
                    <CardHeader>
                        <Typography variant='h6' className="flex items-center gap-2">
                            <ShieldIcon />
                            Risk Management
                        </Typography>
                        <Typography variant='body2'>
                            Configure position limits, stop-loss settings, and risk controls
                        </Typography>
                    </CardHeader>
                    <CardContent>
                        <RiskManagementForm 
                            userId={userId}
                            initialSettings={userSettings}
                        />
                    </CardContent>
                </Card>

                {/* Risk Warnings */}
                <Card className="border-orange-200 bg-orange-50 mt-6">
                    <CardHeader>
                        <Typography variant='h6' className="flex items-center gap-2 text-orange-800">
                            <WarningIcon />
                            Important Risk Disclosures
                        </Typography>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm text-orange-800">
                            <p>
                                <strong>Trading Risk:</strong> All trading involves risk of substantial losses. 
                                Past performance does not guarantee future results.
                            </p>
                            <p>
                                <strong>Automated Trading:</strong> Automated systems may fail and result in 
                                unintended trades. Always monitor your positions.
                            </p>
                            <p>
                                <strong>Market Risk:</strong> Market conditions can change rapidly and may 
                                result in significant losses.
                            </p>
                            <p>
                                <strong>Technology Risk:</strong> System failures, connectivity issues, or 
                                software bugs may prevent order execution.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </TabPanel>
            <TabPanel value={value} index={2}>
                <Card>
                    <CardHeader>
                        <Typography variant='h6' className="flex items-center gap-2">
                            <SmartphoneIcon />
                            OTP Setup for Sell Orders
                        </Typography>
                        <Typography variant='body2'>
                            Configure OTP handling for automated sell order execution
                        </Typography>
                    </CardHeader>
                    <CardContent>
                        <OtpSetupForm 
                            userId={userId}
                            initialSettings={userSettings}
                        />
                    </CardContent>
                </Card>

                {/* OTP Methods Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Card>
                        <CardHeader>
                            <Typography variant='h6' className="text-base">Email OTP</Typography>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">Gmail API integration</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">Automatic parsing</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">Most reliable</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Typography variant='h6' className="text-base">SMS OTP</Typography>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">Android support</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <WarningIcon className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm">Requires permissions</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <WarningIcon className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm">Limited reliability</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Typography variant='h6' className="text-base">iMessage</Typography>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">iOS support</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <WarningIcon className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm">Requires macOS app</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <WarningIcon className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm">Complex setup</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabPanel>
            <TabPanel value={value} index={3}>
                <Card>
                    <CardHeader>
                        <Typography variant='h6' className="flex items-center gap-2">
                            <NotificationsIcon />
                            Notification Settings
                        </Typography>
                        <Typography variant='body2'>
                            Configure alerts for trades, price movements, and AI insights
                        </Typography>
                    </CardHeader>
                    <CardContent>
                        <NotificationSettings userId={userId} />
                    </CardContent>
                </Card>
            </TabPanel>
            <TabPanel value={value} index={4}>
                <Card>
                    <CardHeader>
                        <Typography variant='h6' className="flex items-center gap-2">
                            <SettingsIcon />
                            Broker Preferences
                        </Typography>
                        <Typography variant='body2'>
                            Set default broker for trades and manage connection priorities
                        </Typography>
                    </CardHeader>
                    <CardContent>
                        <BrokerPreferences 
                            userId={userId}
                            brokerAccounts={brokerAccounts as BrokerAccount[]}
                        />
                    </CardContent>
                </Card>
            </TabPanel>
            <TabPanel value={value} index={5}>
                <Card>
                    <CardHeader>
                        <Typography variant='h6' className="flex items-center gap-2">
                            <PersonIcon />
                            Account Settings
                        </Typography>
                        <Typography variant='body2'>
                            Manage your profile information and account preferences
                        </Typography>
                    </CardHeader>
                    <CardContent>
                        <AccountSettings user={user} />
                    </CardContent>
                </Card>
            </TabPanel>
        </div>
    )
}
