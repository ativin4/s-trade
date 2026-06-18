'use client'

import { useState } from 'react'
import { Tabs, Tab, TabPanel } from '@/components/ui/tabs'
import { TradingPreferencesForm } from '@/components/setup/trading-preferences-form'
import { OtpSetupForm } from '@/components/setup/otp-setup-form'
import { RiskManagementForm } from '@/components/setup/risk-management-form'
import { NotificationSettings } from '@/components/setup/notification-settings'
import { BrokerPreferences } from '@/components/setup/broker-preferences'
import { AccountSettings } from '@/components/setup/account-settings'
import type { UserSettings, BrokerAccount } from '@/app/types'

interface SetupClientProps {
  userId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
  userSettings: UserSettings | null
  brokerAccounts: BrokerAccount[]
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden">
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-slate-800">
          {title    && <p className="text-sm font-semibold text-white">{title}</p>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

export function SetupClient({ userId, user, userSettings, brokerAccounts }: SetupClientProps) {
  const [tab, setTab] = useState(0)

  return (
    <div className="space-y-6">
      <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="setup tabs">
        <Tab label="Trading" />
        <Tab label="Risk" />
        <Tab label="OTP Setup" />
        <Tab label="Notifications" />
        <Tab label="Brokers" />
        <Tab label="Account" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <div className="space-y-5">
          <Section title="Trading Preferences" subtitle="Set your default trading parameters and investment preferences">
            <TradingPreferencesForm userId={userId} initialSettings={userSettings} />
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Max Budget Per Trade" value={`₹${(userSettings?.maxBudgetPerTrade ?? 50000).toLocaleString('en-IN')}`} />
            <StatCard label="Risk Tolerance"       value={userSettings?.riskTolerance ?? 'Moderate'} />
            <StatCard label="Auto Trading"         value={userSettings?.autoTradingEnabled ? 'Enabled' : 'Disabled'}
              valueClass={userSettings?.autoTradingEnabled ? 'text-emerald-400' : 'text-slate-500'} />
          </div>
        </div>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <div className="space-y-5">
          <Section title="Risk Management" subtitle="Configure position limits, stop-loss settings, and risk controls">
            <RiskManagementForm userId={userId} initialSettings={userSettings} />
          </Section>

          <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl px-6 py-5 space-y-3">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Risk Disclosures</p>
            {[
              ['Trading Risk',      'All trading involves risk of substantial losses. Past performance does not guarantee future results.'],
              ['Automated Trading', 'Automated systems may fail and result in unintended trades. Always monitor your positions.'],
              ['Market Risk',       'Market conditions can change rapidly and may result in significant losses.'],
              ['Technology Risk',   'System failures, connectivity issues, or software bugs may prevent order execution.'],
            ].map(([k, v]) => (
              <p key={k} className="text-sm text-amber-200/70"><span className="font-semibold text-amber-400">{k}:</span> {v}</p>
            ))}
          </div>
        </div>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <div className="space-y-5">
          <Section title="OTP Setup for Sell Orders" subtitle="Configure OTP handling for automated sell order execution">
            <OtpSetupForm userId={userId} initialSettings={userSettings} />
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Email OTP',  items: [['✓ Gmail API integration', true], ['✓ Automatic parsing', true], ['✓ Most reliable', true]] },
              { name: 'SMS OTP',    items: [['✓ Android support', true], ['⚠ Requires permissions', false], ['⚠ Limited reliability', false]] },
              { name: 'iMessage',   items: [['✓ iOS support', true], ['⚠ Requires macOS app', false], ['⚠ Complex setup', false]] },
            ].map(g => (
              <div key={g.name} className="bg-[#0f1117] border border-slate-800 rounded-xl px-5 py-4">
                <p className="text-sm font-semibold text-white mb-3">{g.name}</p>
                <ul className="space-y-1.5">
                  {g.items.map(([text, ok]) => (
                    <li key={text as string} className={`text-xs ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>{text as string}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <Section title="Notification Settings" subtitle="Configure alerts for trades, price movements, and AI insights">
          <NotificationSettings userId={userId} />
        </Section>
      </TabPanel>

      <TabPanel value={tab} index={4}>
        <Section title="Broker Preferences" subtitle="Set default broker for trades and manage connection priorities">
          <BrokerPreferences userId={userId} brokerAccounts={brokerAccounts} />
        </Section>
      </TabPanel>

      <TabPanel value={tab} index={5}>
        <Section title="Account Settings" subtitle="Manage your profile information and account preferences">
          <AccountSettings user={user} />
        </Section>
      </TabPanel>
    </div>
  )
}

function StatCard({ label, value, valueClass = 'text-white' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-xl px-5 py-4">
      <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  )
}
