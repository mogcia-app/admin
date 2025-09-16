'use client'

import React, { createContext, useContext, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined)

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  const isOpen = open !== undefined ? open : internalOpen
  const handleOpenChange = (newOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => handleOpenChange(false)}
          />
          {/* Content will be rendered by DialogContent */}
        </div>
      )}
    </DialogContext.Provider>
  )
}

export interface DialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

export function DialogTrigger({ asChild, children }: DialogTriggerProps) {
  const context = useContext(DialogContext)
  if (!context) throw new Error('DialogTrigger must be used within Dialog')

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: () => context.onOpenChange(true)
    } as any)
  }

  return (
    <button onClick={() => context.onOpenChange(true)}>
      {children}
    </button>
  )
}

export interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

export function DialogContent({ className, children }: DialogContentProps) {
  const context = useContext(DialogContext)
  if (!context) throw new Error('DialogContent must be used within Dialog')

  if (!context.open) return null

  return (
    <div className={cn(
      'relative z-50 bg-background p-6 shadow-lg rounded-lg w-full max-w-lg mx-4',
      className
    )}>
      <button
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onClick={() => context.onOpenChange(false)}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
      {children}
    </div>
  )
}

export interface DialogHeaderProps {
  className?: string
  children: React.ReactNode
}

export function DialogHeader({ className, children }: DialogHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}>
      {children}
    </div>
  )
}

export interface DialogTitleProps {
  className?: string
  children: React.ReactNode
}

export function DialogTitle({ className, children }: DialogTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h2>
  )
}

export interface DialogDescriptionProps {
  className?: string
  children: React.ReactNode
}

export function DialogDescription({ className, children }: DialogDescriptionProps) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  )
}

export interface DialogFooterProps {
  className?: string
  children: React.ReactNode
}

export function DialogFooter({ className, children }: DialogFooterProps) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>
      {children}
    </div>
  )
}
