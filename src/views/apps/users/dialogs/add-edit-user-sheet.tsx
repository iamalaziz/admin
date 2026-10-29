'use client'

// React Imports
import { useEffect, useMemo } from 'react'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

// Type Imports
import type { AppUser, UserFormData, UserPlan, UserRole, UserSheetMode, UserStatus } from '@/types/apps/user-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

// Hook Imports
import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string

const ROLES: UserRole[] = ['Admin', 'Editor', 'Subscriber', 'Maintainer', 'Guest']
const PLANS: UserPlan[] = ['Basic', 'Team', 'Enterprise']
const STATUSES: UserStatus[] = ['Active', 'Pending', 'Suspended', 'Inactive']

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'India',
  'Japan',
  'Brazil',
  'Netherlands',
  'Singapore',
  'Spain',
  'Italy',
  'Mexico',
  'South Korea'
] as const

// Built from `t` so the validation messages follow the active language.
const buildUserFormSchema = (t: Translate) =>
  z.object({
    name: z.string().min(1, t('users.sheet.errors.nameRequired')),
    email: z.string().min(1, t('users.sheet.errors.emailRequired')).email(t('users.sheet.errors.emailInvalid')),
    contact: z.string().optional(),
    company: z.string().optional(),
    country: z.string().optional(),
    role: z.enum(['Admin', 'Editor', 'Subscriber', 'Maintainer', 'Guest']),
    plan: z.enum(['Basic', 'Team', 'Enterprise']),
    status: z.enum(['Active', 'Pending', 'Suspended', 'Inactive'])
  })

type UserFormValues = z.infer<ReturnType<typeof buildUserFormSchema>>

const defaultValues: UserFormValues = {
  name: '',
  email: '',
  contact: '',
  company: '',
  country: '',
  role: 'Subscriber',
  plan: 'Basic',
  status: 'Active'
}

export interface AddEditUserSheetProps {
  mode: UserSheetMode | null
  user: AppUser | null
  onClose: () => void
  onAdd: (data: UserFormData) => void
  onEdit: (id: string, data: Partial<UserFormData>) => void
}

export function AddEditUserSheet({ mode, user, onClose, onAdd, onEdit }: AddEditUserSheetProps) {
  const { t } = useTranslation()

  const userFormSchema = useMemo(() => buildUserFormSchema(t), [t])

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues
  })

  useEffect(() => {
    if (mode === 'edit' && user) {
      form.reset({
        name: user.name,
        email: user.email,
        contact: user.contact ?? '',
        company: user.company ?? '',
        country: user.country ?? '',
        role: user.role,
        plan: user.plan,
        status: user.status
      })

      return
    }

    if (mode === 'add') {
      form.reset(defaultValues)
    }
  }, [form, mode, user])

  const handleSubmit = (values: UserFormValues) => {
    const data: UserFormData = {
      name: values.name,
      email: values.email,
      contact: values.contact || undefined,
      company: values.company || undefined,
      country: values.country || undefined,
      role: values.role,
      plan: values.plan,
      status: values.status
    }

    if (mode === 'add') {
      onAdd(data)
    }

    if (mode === 'edit' && user) {
      onEdit(user.id, data)
    }
  }

  return (
    <Sheet open={mode !== null} onOpenChange={open => !open && onClose()}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-[420px]'>
        <SheetHeader className='pb-0'>
          <SheetTitle className='text-lg font-medium'>
            {mode === 'edit' ? t('users.sheet.editTitle') : t('users.sheet.addTitle')}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-4 px-4 pb-4'>
          <FieldGroup className='gap-4'>
            <Controller
              name='name'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('users.sheet.name')}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder={t('users.sheet.namePlaceholder')}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name='email'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('users.sheet.email')}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type='email'
                    placeholder={t('users.sheet.emailPlaceholder')}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name='contact'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('users.sheet.contact')}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type='tel'
                    placeholder={t('users.sheet.contactPlaceholder')}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name='company'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('users.sheet.company')}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder={t('users.sheet.companyPlaceholder')}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name='country'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor='country'>{t('users.sheet.country')}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id='country' className='w-full'>
                      <SelectValue placeholder={t('users.sheet.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectGroup>
                        {COUNTRIES.map(country => (
                          <SelectItem key={country} value={country}>
                            {t(`users.countries.${country}`)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name='role'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor='role'>{t('users.sheet.role')}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id='role' className='w-full'>
                      <SelectValue placeholder={t('users.sheet.selectRole')} />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectGroup>
                        {ROLES.map(role => (
                          <SelectItem key={role} value={role}>
                            {t(`users.roles.${role}`)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name='plan'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor='plan'>{t('users.sheet.plan')}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id='plan' className='w-full'>
                      <SelectValue placeholder={t('users.sheet.selectPlan')} />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectGroup>
                        {PLANS.map(plan => (
                          <SelectItem key={plan} value={plan}>
                            {t(`users.plans.${plan}`)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name='status'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor='status'>{t('users.sheet.status')}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id='status' className='w-full'>
                      <SelectValue placeholder={t('users.sheet.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectGroup>
                        {STATUSES.map(status => (
                          <SelectItem key={status} value={status}>
                            {t(`users.statuses.${status}`)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <SheetFooter className='px-0 sm:flex-row'>
            <Button type='submit' variant='outline' onClick={onClose} className='sm:flex-1'>
              {t('common.cancel')}
            </Button>
            <Button type='submit' className='sm:flex-1'>
              {t('common.saveChanges')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
