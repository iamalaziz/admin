'use client'

import { useEffect } from 'react'

import { Controller, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useTranslation } from '@/lib/i18n'
import type { AdminUser, SubscriptionCode, SubscriptionPayload } from '@/types/wordzen/user-types'
import { SUBSCRIPTION_CODES } from '@/types/wordzen/user-types'

/** The free tier is the absence of a row, so the switcher needs a value to stand for it. */
const FREE_PLAN = 'NONE'

type UserSubscriptionFormValues = {
  plan: SubscriptionCode | typeof FREE_PLAN
  endSubscriptionDate: string
}

const emptyValues: UserSubscriptionFormValues = { plan: FREE_PLAN, endSubscriptionDate: '' }

/** `<input type='date'>` speaks `YYYY-MM-DD`; the entity stores an instant. */
const toDateInput = (value: string | null) => value?.slice(0, 10) ?? ''

/** End of the chosen day, so the date the admin picks is still a day of access. */
const toEndOfDayIso = (value: string) => (value ? new Date(`${value}T23:59:59.999Z`).toISOString() : null)

export interface UserSubscriptionSheetProps {
  user: AdminUser | null
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: SubscriptionPayload) => void
}

/**
 * The plan switcher behind the Subscription card's button. No endpoint switches a plan —
 * see the note in user-types.ts — so a save only reaches the fixture store.
 */
export function UserSubscriptionSheet({ user, onOpenChange, onSubmit }: UserSubscriptionSheetProps) {
  const { t } = useTranslation()

  const form = useForm<UserSubscriptionFormValues>({ defaultValues: emptyValues })

  // useWatch rather than form.watch: the latter returns a fresh function each render, which
  // the React Compiler cannot memoize.
  const plan = useWatch({ control: form.control, name: 'plan' })

  useEffect(() => {
    if (!user) {
      return
    }

    form.reset({
      plan: user.subscription?.code ?? FREE_PLAN,
      endSubscriptionDate: toDateInput(user.subscription?.endSubscriptionDate ?? null)
    })
  }, [form, user])

  const handleSubmit = (values: UserSubscriptionFormValues) => {
    onSubmit(
      values.plan === FREE_PLAN
        ? { code: null, endSubscriptionDate: null }
        : { code: values.plan, endSubscriptionDate: toEndOfDayIso(values.endSubscriptionDate) }
    )
    onOpenChange(false)
  }

  return (
    <Sheet open={user !== null} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-[460px]'>
        <SheetHeader className='pb-0'>
          <SheetTitle className='text-lg font-medium'>
            {t('manage.userSubscriptionSheet.title', { name: user?.username ?? '' })}
          </SheetTitle>
          <SheetDescription>{t('manage.userSubscriptionSheet.description')}</SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-5 px-4 pb-4'>
          <FieldGroup className='gap-4'>
            <Controller
              name='plan'
              control={form.control}
              render={({ field }) => (
                <Field className='gap-2'>
                  <FieldLabel htmlFor='plan'>{t('manage.userDetail.fields.plan')}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id='plan' className='w-full'>
                      <SelectValue placeholder={t('manage.filters.subscriptionPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FREE_PLAN}>{t('manage.userSubscriptionSheet.freePlan')}</SelectItem>
                      {SUBSCRIPTION_CODES.map(code => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {plan === FREE_PLAN
                      ? t('manage.userSubscriptionSheet.freePlanHint')
                      : t('manage.userSubscriptionSheet.planHint')}
                  </FieldDescription>
                </Field>
              )}
            />

            <Controller
              name='endSubscriptionDate'
              control={form.control}
              render={({ field }) => (
                <Field className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('manage.userSubscriptionSheet.endsLabel')}</FieldLabel>
                  <Input {...field} id={field.name} type='date' disabled={plan === FREE_PLAN} />
                  <FieldDescription>{t('manage.userSubscriptionSheet.endsHint')}</FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>

          <SheetFooter className='flex-row justify-end gap-2 px-0'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type='submit'>{t('manage.userSubscriptionSheet.submit')}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
