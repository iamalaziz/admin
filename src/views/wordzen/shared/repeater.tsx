'use client'

import type { ReactNode } from 'react'

import { PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * Presentational scaffolding for the repeating locale-keyed sections — course
 * descriptions, card translations and samples, phrase explanations.
 *
 * Only the chrome is shared. Each form drives its own `useFieldArray`, because the row
 * shapes differ (`value`, `value`+`translation`, `text`) and a generic over
 * react-hook-form's field paths costs more in type gymnastics than it saves in lines.
 */

export interface RepeaterHeaderProps {
  title: string
  description?: string
  addLabel: string
  onAdd: () => void

  /** Set when every locale already has a row, so there is nothing left to add. */
  disabled?: boolean
  disabledHint?: string
}

export function RepeaterHeader({
  title,
  description,
  addLabel,
  onAdd,
  disabled = false,
  disabledHint
}: RepeaterHeaderProps) {
  return (
    <div className='flex items-start justify-between gap-3'>
      <div className='flex flex-col gap-0.5'>
        <span className='text-sm font-medium'>{title}</span>
        {description ? <span className='text-muted-foreground text-xs'>{description}</span> : null}
      </div>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={onAdd}
        disabled={disabled}
        title={disabled ? disabledHint : undefined}
      >
        <PlusIcon className='size-3.5' />
        {addLabel}
      </Button>
    </div>
  )
}

export interface RepeaterRowProps {
  children: ReactNode
  onRemove: () => void
  removeLabel: string
}

export function RepeaterRow({ children, onRemove, removeLabel }: RepeaterRowProps) {
  return (
    <div className='flex items-start gap-2 rounded-md border p-3'>
      <div className='flex min-w-0 flex-1 flex-col gap-3'>{children}</div>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        onClick={onRemove}
        aria-label={removeLabel}
        className='text-muted-foreground hover:text-destructive'
      >
        <Trash2Icon className='size-4' />
      </Button>
    </div>
  )
}

export function RepeaterEmpty({ message }: { message: string }) {
  return <p className='text-muted-foreground rounded-md border border-dashed p-3 text-xs'>{message}</p>
}
