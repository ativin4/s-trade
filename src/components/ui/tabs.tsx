'use client'

import { cn } from '@/lib/utils'

interface TabsProps {
  value: number
  onChange: (e: React.SyntheticEvent, v: number) => void
  children: React.ReactNode
  'aria-label'?: string
}

interface TabProps {
  label: string
  icon?: React.ReactNode
}

interface TabPanelProps {
  value: number
  index: number
  children: React.ReactNode
}

function Tabs({ value, onChange, children }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-slate-800 overflow-x-auto">
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return null
        const tabProps = child.props as TabProps
        const active = value === i
        return (
          <button
            key={i}
            onClick={e => onChange(e, i)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0',
              active
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            )}
          >
            {tabProps.icon && <span className="[&>svg]:w-4 [&>svg]:h-4">{tabProps.icon}</span>}
            {tabProps.label}
          </button>
        )
      })}
    </div>
  )
}

function Tab(_props: TabProps) { return null }

function TabPanel({ value, index, children }: TabPanelProps) {
  if (value !== index) return null
  return <div>{children}</div>
}

// Need React for Children.map
import React from 'react'

export { Tabs, Tab, TabPanel }
