'use client'

import { useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useTranslation } from '@/lib/i18n'
import type { Translate } from '@/lib/i18n'
import type { Course, Module, ModulePayload } from '@/types/wordzen/content-types'

/** Mirrors `dto/request/ModuleRequest`; cards are managed on their own endpoint. */
const createModuleFormSchema = (t: Translate) =>
  z.object({
    title: z.string().trim().min(2, t('manage.moduleForm.validation.titleMin')),
    isPublic: z.boolean()
  })

type ModuleFormValues = z.infer<ReturnType<typeof createModuleFormSchema>>

const emptyValues: ModuleFormValues = { title: '', isPublic: false }

export interface ModuleFormSheetProps {
  open: boolean
  module: Module | null
  course: Course
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: ModulePayload) => void
}

export function ModuleFormSheet({ open, module, course, onOpenChange, onSubmit }: ModuleFormSheetProps) {
  const { t } = useTranslation()
  const isEdit = module !== null

  const schema = useMemo(() => createModuleFormSchema(t), [t])

  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(module ? { title: module.title, isPublic: module.isPublic } : emptyValues)
  }, [form, module, open])

  const handleSubmit = (values: ModuleFormValues) => {
    onSubmit({
      title: values.title,
      isPublic: values.isPublic,
      courseId: course.id,
      displayOrder: module?.displayOrder ?? 0
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-[460px]'>
        <SheetHeader className='pb-0'>
          <SheetTitle className='text-lg font-medium'>
            {isEdit ? t('manage.moduleForm.editTitle') : t('manage.moduleForm.newTitle')}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? t('manage.moduleForm.editDescription')
              : t('manage.moduleForm.createDescription', { course: course.title })}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-5 px-4 pb-4'>
          <FieldGroup className='gap-4'>
            <Controller
              name='title'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('manage.common.title')}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder={t('manage.moduleForm.titlePlaceholder')}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name='isPublic'
              control={form.control}
              render={({ field }) => (
                <Field orientation='horizontal' className='items-center justify-between gap-3'>
                  <div className='flex flex-col gap-0.5'>
                    <FieldLabel htmlFor='moduleIsPublic'>{t('manage.common.published')}</FieldLabel>
                    <FieldDescription>
                      {course.isPublic ? t('manage.moduleForm.publishedHint') : t('manage.moduleForm.draftCourseHint')}
                    </FieldDescription>
                  </div>
                  <Switch
                    id='moduleIsPublic'
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!course.isPublic}
                  />
                </Field>
              )}
            />
          </FieldGroup>

          <SheetFooter className='flex-row justify-end gap-2 px-0'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type='submit'>
              {isEdit ? t('manage.moduleForm.editSubmit') : t('manage.moduleForm.createSubmit')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
