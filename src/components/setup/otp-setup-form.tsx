'use client'

import { useState } from 'react'
import { saveUserSettings } from '@/lib/actions/user'
import toast from 'react-hot-toast'
import type { UserSettings, OTPMethod } from '@/app/types'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import EmailIcon from '@mui/icons-material/Email'
import SmsIcon from '@mui/icons-material/Sms'
import AppleIcon from '@mui/icons-material/Apple'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InfoIcon from '@mui/icons-material/Info'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

interface OtpSetupFormProps {
  userId: string
  initialSettings: UserSettings | null
}

const OTP_METHODS: {
  id: OTPMethod
  label: string
  description: string
  icon: React.ReactNode
  pros: string[]
  cons: string[]
  badge?: string
}[] = [
  {
    id: 'TOTP',
    label: 'TOTP (Auto)',
    description: 'Auto-generate OTPs using the TOTP secret stored in your broker account. Zero manual intervention.',
    icon: <SmartphoneIcon />,
    pros: ['Fully automated', 'No network delay', 'Works offline', 'Most reliable'],
    cons: ['Requires TOTP secret from broker'],
    badge: 'Recommended',
  },
  {
    id: 'EMAIL',
    label: 'Email OTP',
    description: 'Parse OTP from broker emails via Gmail API. Requires Google account with Gmail access.',
    icon: <EmailIcon />,
    pros: ['Works with any device', 'Automatic parsing'],
    cons: ['Depends on email delivery speed', 'Requires Gmail API setup'],
  },
  {
    id: 'SMS',
    label: 'SMS OTP',
    description: 'Read OTP from SMS messages. Requires Android device with SMS permissions.',
    icon: <SmsIcon />,
    pros: ['Universal broker support'],
    cons: ['Android only', 'Requires device permissions', 'May be slow'],
  },
  {
    id: 'IMESSAGE',
    label: 'iMessage',
    description: 'Parse OTP from iMessage on macOS. Requires Messages app access on Mac.',
    icon: <AppleIcon />,
    pros: ['iOS/macOS native'],
    cons: ['Requires macOS', 'Complex setup', 'iMessage permissions needed'],
  },
]

export function OtpSetupForm({ userId: _userId, initialSettings }: OtpSetupFormProps) {
  const [selected, setSelected] = useState<OTPMethod>(initialSettings?.otpMethod ?? 'TOTP')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await saveUserSettings({ otpMethod: selected })
      toast.success('OTP method saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OTP_METHODS.map((method) => {
          const isSelected = selected === method.id
          return (
            <button
              key={method.id}
              onClick={() => setSelected(method.id)}
              className="text-left w-full"
            >
              <div
                className={`rounded-lg border-2 p-4 transition-all cursor-pointer h-full ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={isSelected ? 'text-blue-400' : 'text-slate-400'}>
                      {method.icon}
                    </span>
                    <span className="font-semibold text-white">{method.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.badge && (
                      <Chip label={method.badge} size="small" color="primary" />
                    )}
                    {isSelected && <CheckCircleIcon className="text-blue-400" fontSize="small" />}
                  </div>
                </div>

                <p className="text-sm text-slate-400 mb-3">{method.description}</p>

                <div className="space-y-1">
                  {method.pros.map((pro) => (
                    <div key={pro} className="flex items-center gap-1.5 text-xs text-green-400">
                      <CheckCircleIcon fontSize="inherit" />
                      <span>{pro}</span>
                    </div>
                  ))}
                  {method.cons.map((con) => (
                    <div key={con} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <InfoIcon fontSize="inherit" />
                      <span>{con}</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {selected === 'TOTP' && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
          <Typography variant="subtitle2" className="text-blue-300 mb-2 flex items-center gap-2">
            <InfoIcon fontSize="small" />
            TOTP Setup
          </Typography>
          <Typography variant="body2" className="text-slate-400">
            Add your broker&apos;s TOTP secret in the <strong className="text-white">Brokers</strong> section
            (Settings → Brokers → Add Account → TOTP Secret). s-trade will auto-generate OTPs using RFC 6238,
            so no manual entry is needed during trades.
          </Typography>
        </div>
      )}

      {selected === 'EMAIL' && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <Typography variant="subtitle2" className="text-yellow-300 mb-2">
            Gmail API — coming soon
          </Typography>
          <Typography variant="body2" className="text-slate-400">
            Gmail integration is under development. For now, use TOTP for fully automated OTP handling.
          </Typography>
        </div>
      )}

      {(selected === 'SMS' || selected === 'IMESSAGE') && (
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4">
          <Typography variant="subtitle2" className="text-orange-300 mb-2">
            Device integration — coming soon
          </Typography>
          <Typography variant="body2" className="text-slate-400">
            {selected === 'SMS' ? 'Android SMS' : 'iMessage'} integration is planned.
            For automated trading, TOTP is the recommended method.
          </Typography>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save OTP Method'}
        </Button>
      </div>
    </div>
  )
}
