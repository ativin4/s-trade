"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// --- Context for sharing state between tooltip components ---
type TooltipState = {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  triggerRef: React.RefObject<HTMLElement | null>
}
const TooltipContext = React.createContext<TooltipState | null>(null)

const useTooltipContext = () => {
  const context = React.useContext(TooltipContext)
  if (!context) {
    throw new Error("Tooltip components must be used within a <Tooltip> component")
  }
  return context
}

// --- TooltipProvider (for global settings, matches Radix API) ---
export const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

// --- Tooltip (Root state manager) ---
export const Tooltip = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement>(null)
  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  )
}

// --- TooltipTrigger ---
// Wraps the trigger element in a span to attach listeners and a ref simply and robustly,
// avoiding the complexities and type errors of React.cloneElement.
export const TooltipTrigger = ({ children }: { children: React.ReactNode }) => {
  const { setIsOpen, triggerRef } = useTooltipContext()
  return (
    <span
      ref={triggerRef as React.RefObject<HTMLSpanElement>}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      className="inline-block"
    >
      {children}
    </span>
  )
}

// --- TooltipContent ---
// Renders the tooltip content, positioned relative to the trigger.
export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isOpen, triggerRef } = useTooltipContext()
  const [style, setStyle] = React.useState<React.CSSProperties>({})

  React.useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      setStyle({
        position: "absolute",
        top: `${triggerRect.bottom + window.scrollY + 4}px`,
        left: `${triggerRect.left + window.scrollX + triggerRect.width / 2}px`,
        transform: "translateX(-50%)",
      })
    }
  }, [isOpen, triggerRef])

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  )
})
TooltipContent.displayName = "TooltipContent"
