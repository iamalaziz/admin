'use client'

import { useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/lib/i18n'
import type { Translate } from '@/lib/i18n'
import type { Achievement, AchievementGroupCode, AchievementPayload } from '@/types/wordzen/achievement-types'
import { ACHIEVEMENT_GROUP_CODES, SEED_ACHIEVEMENT_GROUPS } from '@/types/wordzen/achievement-types'

/**
 * The writable columns of `model/Achievement`. The lengths are the column lengths, so a row
 * that passes here is one the table would actually accept.
 *
 * `takenCodes` is checked in the form rather than in the store, because the store has no
 * way to report why a create came back null.
 */
const createAchievementFormSchema = (t: Translate, takenCodes: string[]) =>
  z.object({
    code: z
      .string()
      .trim()
      .min(1, t('manage.achievementForm.validation.codeRequired'))
      .max(64, t('manage.achievementForm.validation.codeMax'))

      // `AchievementCode` spells every seeded code this way, and the services award by it.
      .regex(/^[a-z0-9_]+$/, t('manage.achievementForm.validation.codePattern'))
      .refine(code => !takenCodes.includes(code), t('manage.achievementForm.validation.codeTaken')),
    groupCode: z.enum(ACHIEVEMENT_GROUP_CODES),
    title: z
      .string()
      .trim()
      .min(2, t('manage.achievementForm.validation.titleMin'))
      .max(128, t('manage.achievementForm.validation.titleMax')),
    description: z
      .string()
      .trim()
      .min(1, t('manage.achievementForm.validation.descriptionRequired'))
      .max(512, t('manage.achievementForm.validation.descriptionMax')),
    active: z.boolean()
  })

type AchievementFormValues = z.infer<ReturnType<typeof createAchievementFormSchema>>

const emptyValues: AchievementFormValues = {
  code: '',
  groupCode: 'start',
  title: '',
  description: '',
  active: true
}

const toFormValues = (achievement: Achievement): AchievementFormValues => ({
  code: achievement.code,
  groupCode: achievement.group.code,
  title: achievement.title,
  description: achievement.description,
  active: achievement.active
})

export interface AchievementFormSheetProps {
  open: boolean

  /** The achievement being edited, or null when creating. */
  achievement: Achievement | null

  /** Every code already in the catalogue; the edited row's own code is filtered out. */
  takenCodes: string[]
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: AchievementPayload) => void
}

export function AchievementFormSheet({
  open,
  achievement,
  takenCodes,
  onOpenChange,
  onSubmit
}: AchievementFormSheetProps) {
  const { t } = useTranslation()
  const isEdit = achievement !== null

  const schema = useMemo(
    () =>
      createAchievementFormSchema(
        t,
        takenCodes.filter(code => code !== achievement?.code)
      ),
    [achievement?.code, t, takenCodes]
  )

  const form = useForm<AchievementFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(achievement ? toFormValues(achievement) : emptyValues)
  }, [achievement, form, open])

  const handleSubmit = (values: AchievementFormValues) => {
    onSubmit({
      code: values.code,
      groupCode: values.groupCode as AchievementGroupCode,
      title: values.title,
      description: values.description,
      active: values.active
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-[520px]'>
        <SheetHeader className='pb-0'>
          <SheetTitle className='text-lg font-medium'>
            {isEdit ? t('manage.achievementForm.editTitle') : t('manage.achievementForm.newTitle')}
          </SheetTitle>
          <SheetDescription>
            {isEdit ? t('manage.achievementForm.editDescription') : t('manage.achievementForm.createDescription')}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-5 px-4 pb-4'>
          <FieldGroup className='gap-4'>
            <Controller
              name='code'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('manage.achievementForm.codeLabel')}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder={t('manage.achievementForm.codePlaceholder')}
                    className='font-mono'
                    disabled={isEdit}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    {isEdit ? t('manage.achievementForm.codeLockedHint') : t('manage.achievementForm.codeHint')}
                  </FieldDescription>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name='groupCode'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor='groupCode'>{t('manage.achievementForm.groupLabel')}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id='groupCode' className='w-full'>
                      <SelectValue placeholder={t('manage.achievementForm.groupPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {SEED_ACHIEVEMENT_GROUPS.map(group => (
                        <SelectItem key={group.code} value={group.code}>
                          {group.title} - {group.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>{t('manage.achievementForm.groupHint')}</FieldDescription>
                </Field>
              )}
            />

            <Controller
              name='title'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('manage.common.title')}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder={t('manage.achievementForm.titlePlaceholder')}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name='description'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('manage.achievementForm.descriptionLabel')}</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    rows={3}
                    placeholder={t('manage.achievementForm.descriptionPlaceholder')}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>{t('manage.achievementForm.descriptionHint')}</FieldDescription>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name='active'
              control={form.control}
              render={({ field }) => (
                <Field orientation='horizontal' className='items-center justify-between gap-3'>
                  <div className='flex flex-col gap-0.5'>
                    <FieldLabel htmlFor='achievementActive'>{t('manage.achievementForm.activeLabel')}</FieldLabel>
                    <FieldDescription>{t('manage.achievementForm.activeHint')}</FieldDescription>
                  </div>
                  <Switch id='achievementActive' checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />
          </FieldGroup>

          <SheetFooter className='flex-row justify-end gap-2 px-0'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type='submit'>
              {isEdit ? t('manage.achievementForm.editSubmit') : t('manage.achievementForm.createSubmit')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
