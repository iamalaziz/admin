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
import { useTranslation } from '@/lib/i18n'
import type { Translate } from '@/lib/i18n'
import type { CourseCategory, CourseCategoryCode, CourseCategoryPayload } from '@/types/wordzen/content-types'
import { COURSE_CATEGORY_CODES } from '@/types/wordzen/content-types'

/**
 * A `course_category` row: a code off the `CourseCategoryCode` enum and a display name.
 *
 * Built from `t` rather than at module scope, so the messages follow the active language.
 */
const createCategoryFormSchema = (t: Translate) =>
  z.object({
    code: z.enum(COURSE_CATEGORY_CODES),
    name: z.string().trim().min(2, t('manage.categoryForm.validation.nameMin'))
  })

type CategoryFormValues = z.infer<ReturnType<typeof createCategoryFormSchema>>

export interface CategoryFormSheetProps {
  open: boolean

  /** The category being edited, or null when creating. */
  category: CourseCategory | null

  /** Codes no row holds yet. Only meaningful when creating — an edit keeps its own code. */
  availableCodes: CourseCategoryCode[]
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: CourseCategoryPayload) => void
}

export function CategoryFormSheet({ open, category, availableCodes, onOpenChange, onSubmit }: CategoryFormSheetProps) {
  const { t } = useTranslation()
  const isEdit = category !== null

  const schema = useMemo(() => createCategoryFormSchema(t), [t])

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: COURSE_CATEGORY_CODES[0], name: '' }
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(
      category
        ? { code: category.code, name: category.name }
        : { code: availableCodes[0] ?? COURSE_CATEGORY_CODES[0], name: '' }
    )
  }, [availableCodes, category, form, open])

  const handleSubmit = (values: CategoryFormValues) => {
    onSubmit({ code: values.code, name: values.name.trim() })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-[460px]'>
        <SheetHeader className='pb-0'>
          <SheetTitle className='text-lg font-medium'>
            {isEdit ? t('manage.categoryForm.editTitle') : t('manage.categoryForm.newTitle')}
          </SheetTitle>
          <SheetDescription>
            {isEdit ? t('manage.categoryForm.editDescription') : t('manage.categoryForm.createDescription')}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-5 px-4 pb-4'>
          <FieldGroup className='gap-4'>
            <Controller
              name='code'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor='code'>{t('manage.categoryForm.codeLabel')}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                    <SelectTrigger id='code' className='w-full'>
                      <SelectValue placeholder={t('manage.categoryForm.codePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(isEdit ? [field.value] : availableCodes).map(code => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {isEdit ? t('manage.categoryForm.codeFixedHint') : t('manage.categoryForm.codeHint')}
                  </FieldDescription>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name='name'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('manage.categoryForm.nameLabel')}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder={t('manage.categoryForm.namePlaceholder')}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>{t('manage.categoryForm.nameHint')}</FieldDescription>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <SheetFooter className='flex-row justify-end gap-2 px-0'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type='submit'>
              {isEdit ? t('manage.categoryForm.editSubmit') : t('manage.categoryForm.createSubmit')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
