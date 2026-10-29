'use client'

import { useEffect } from 'react'

import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useTranslation } from '@/lib/i18n'
import type { AdminUser, RoleCode } from '@/types/wordzen/user-types'

/** ROLE_USER is implicit for every account, so only the staff grants are editable. */
const STAFF_ROLES = ['ROLE_AUTHOR', 'ROLE_ADMIN'] as const

type UserRolesFormValues = Record<(typeof STAFF_ROLES)[number], boolean>

const emptyValues: UserRolesFormValues = { ROLE_AUTHOR: false, ROLE_ADMIN: false }

export interface UserRolesSheetProps {
  user: AdminUser | null
  onOpenChange: (open: boolean) => void
  onSubmit: (roles: RoleCode[]) => void
}

/**
 * The roles editor behind the table's edit action, mirroring the Roles card on the detail
 * page. No endpoint grants roles yet — see the note in user-types.ts — so a save only
 * reaches the fixture store.
 */
export function UserRolesSheet({ user, onOpenChange, onSubmit }: UserRolesSheetProps) {
  const { t } = useTranslation()

  const form = useForm<UserRolesFormValues>({ defaultValues: emptyValues })

  useEffect(() => {
    if (!user) {
      return
    }

    form.reset({
      ROLE_AUTHOR: user.roles.includes('ROLE_AUTHOR'),
      ROLE_ADMIN: user.roles.includes('ROLE_ADMIN')
    })
  }, [form, user])

  const handleSubmit = (values: UserRolesFormValues) => {
    onSubmit(STAFF_ROLES.filter(role => values[role]))
    onOpenChange(false)
  }

  return (
    <Sheet open={user !== null} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-[460px]'>
        <SheetHeader className='pb-0'>
          <SheetTitle className='text-lg font-medium'>
            {t('manage.userRolesSheet.title', { name: user?.username ?? '' })}
          </SheetTitle>
          <SheetDescription>{t('manage.userRolesSheet.description')}</SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-5 px-4 pb-4'>
          <FieldGroup className='gap-4'>
            {STAFF_ROLES.map(role => (
              <Controller
                key={role}
                name={role}
                control={form.control}
                render={({ field }) => (
                  <Field orientation='horizontal' className='items-center justify-between gap-3'>
                    <div className='flex flex-col gap-0.5'>
                      <FieldLabel htmlFor={role}>{t(`manage.roles.${role}`)}</FieldLabel>
                      <FieldDescription>{t(`manage.userRolesSheet.scopes.${role}`)}</FieldDescription>
                    </div>
                    <Switch id={role} checked={field.value} onCheckedChange={field.onChange} />
                  </Field>
                )}
              />
            ))}
          </FieldGroup>

          <SheetFooter className='flex-row justify-end gap-2 px-0'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type='submit'>{t('manage.userRolesSheet.submit')}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
