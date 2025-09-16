'use client'

import React, { createContext, useContext, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined)

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  children: React.ReactNode
}

export function Select({ value, onValueChange, defaultValue, children }: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const [open, setOpen] = useState(false)

  const currentValue = value !== undefined ? value : internalValue
  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
    setOpen(false)
  }

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        onOpenChange: setOpen,
      }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  const context = useContext(SelectContext)
  if (!context) throw new Error('SelectTrigger must be used within Select')

  return (
    <button
      type="button"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onClick={() => context.onOpenChange(!context.open)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

export interface SelectValueProps {
  placeholder?: string
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const context = useContext(SelectContext)
  if (!context) throw new Error('SelectValue must be used within Select')

  return (
    <span className={context.value ? '' : 'text-muted-foreground'}>
      {context.value || placeholder}
    </span>
  )
}

export interface SelectContentProps {
  children: React.ReactNode
}

export function SelectContent({ children }: SelectContentProps) {
  const context = useContext(SelectContext)
  if (!context) throw new Error('SelectContent must be used within Select')

  if (!context.open) return null

  return (
    <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      {children}
    </div>
  )
}

export interface SelectItemProps {
  value: string
  children: React.ReactNode
}

export function SelectItem({ value, children }: SelectItemProps) {
  const context = useContext(SelectContext)
  if (!context) throw new Error('SelectItem must be used within Select')

  return (
    <div
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        context.value === value && 'bg-accent text-accent-foreground'
      )}
      onClick={() => context.onValueChange(value)}
    >
      {children}
    </div>
  )
}
