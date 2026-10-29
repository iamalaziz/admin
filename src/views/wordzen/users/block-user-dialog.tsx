'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/lib/i18n'
import type { AdminUser } from '@/types/wordzen/user-types'

export interface BlockUserDialogProps {
  user: AdminUser | null
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string | null) => void
}

/**
 * `PUT /api/v1/admin/users/{uid}/block` with `BlockUserRequest`.
 *
 * The reason is optional in the API (`@RequestBody(required = false)`), so the dialog
 * allows an empty one rather than forcing a placeholder into the audit trail.
 */
export function BlockUserDialog({ user, onOpenChange, onConfirm }: BlockUserDialogProps) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')

  // Clearing on close rather than on open keeps this out of an effect, and covers every
  // way the dialog can close: cancel, confirm, escape and the backdrop.
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReason('')
    }

    onOpenChange(open)
  }

  return (
    <Dialog open={user !== null} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('manage.blockDialog.title', { name: user?.username ?? '' })}</DialogTitle>
          <DialogDescription>{t('manage.blockDialog.description')}</DialogDescription>
        </DialogHeader>

        <Field className='gap-2'>
          <FieldLabel htmlFor='blockReason'>{t('manage.blockDialog.reasonLabel')}</FieldLabel>
          <Textarea
            id='blockReason'
            rows={3}
            value={reason}
            onChange={event => setReason(event.target.value)}
            placeholder={t('manage.blockDialog.reasonPlaceholder')}
          />
          <FieldDescription>{t('manage.blockDialog.reasonHint')}</FieldDescription>
        </Field>

        <DialogFooter>
          <Button variant='outline' type='button' onClick={() => handleOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant='destructive'
            type='button'
            onClick={() => {
              onConfirm(reason.trim() ? reason.trim() : null)
              handleOpenChange(false)
            }}
          >
            {t('manage.blockDialog.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
