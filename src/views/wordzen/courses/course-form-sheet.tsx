'use client'

import { useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useCourseCategories } from '@/hooks/wordzen/use-category-list'
import { useTranslation } from '@/lib/i18n'
import type { Translate } from '@/lib/i18n'
import type { Course, CourseCategory, CoursePayload } from '@/types/wordzen/content-types'
import { COURSE_ACCESS_CODES, COURSE_CATEGORY_CODES, LOCALE_CODES } from '@/types/wordzen/content-types'

import { RepeaterEmpty, RepeaterHeader, RepeaterRow } from '../shared/repeater'

/**
 * Mirrors `dto/request/CourseRequest`. `displayOrder` is left to the reorder endpoint.
 *
 * Built from `t` rather than at module scope, so the messages follow the active language.
 */
const createCourseFormSchema = (t: Translate) =>
  z.object({
    title: z.string().trim().min(2, t('manage.courseForm.validation.titleMin')),
    category: z.enum(COURSE_CATEGORY_CODES),
    accessCode: z.enum(COURSE_ACCESS_CODES),
    isPublic: z.boolean(),
    cover: z.string().trim(),
    descriptions: z
      .array(
        z.object({
          locale: z.enum(LOCALE_CODES),
          value: z.string().trim().min(1, t('manage.courseForm.validation.descriptionRequired'))
        })
      )

      // One row per locale: `CourseDescription` is keyed by locale, so two RU rows would
      // mean two descriptions competing for the same slot on the learner side.
      .refine(rows => new Set(rows.map(row => row.locale)).size === rows.length, {
        message: t('manage.courseForm.validation.localeOnce')
      })
  })

type CourseFormValues = z.infer<ReturnType<typeof createCourseFormSchema>>

/** Takes the live categories so a new course opens on the first one that actually exists. */
const emptyValues = (categories: CourseCategory[]): CourseFormValues => ({
  title: '',
  category: categories[0]?.code ?? COURSE_CATEGORY_CODES[0],
  accessCode: 'FREE',
  isPublic: false,
  cover: '',
  descriptions: []
})

const toFormValues = (course: Course): CourseFormValues => ({
  title: course.title,
  category: course.category.code,
  accessCode: course.accessCode,
  isPublic: course.isPublic,
  cover: course.cover ?? '',
  descriptions: course.descriptions.map(description => ({
    locale: description.locale,
    value: description.value
  }))
})

export interface CourseFormSheetProps {
  open: boolean

  /** The course being edited, or null when creating. */
  course: Course | null
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: CoursePayload) => void
}

export function CourseFormSheet({ open, course, onOpenChange, onSubmit }: CourseFormSheetProps) {
  const { t } = useTranslation()
  const categories = useCourseCategories()
  const isEdit = course !== null

  const schema = useMemo(() => createCourseFormSchema(t), [t])

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues(categories)
  })

  const descriptions = useFieldArray({ control: form.control, name: 'descriptions' })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(course ? toFormValues(course) : emptyValues(categories))
  }, [categories, course, form, open])

  // useWatch rather than form.watch: the latter returns a fresh function each render, which
  // React Compiler refuses to memoize.
  const watchedDescriptions = useWatch({ control: form.control, name: 'descriptions' }) ?? []
  const usedLocales = watchedDescriptions.map(row => row.locale)
  const nextFreeLocale = LOCALE_CODES.find(locale => !usedLocales.includes(locale))

  const handleSubmit = (values: CourseFormValues) => {
    onSubmit({
      title: values.title,
      category: values.category,
      accessCode: values.accessCode,
      isPublic: values.isPublic,
      cover: values.cover.trim() ? values.cover.trim() : null,
      displayOrder: course?.displayOrder ?? 0,
      descriptions: values.descriptions
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-[520px]'>
        <SheetHeader className='pb-0'>
          <SheetTitle className='text-lg font-medium'>
            {isEdit ? t('manage.courseForm.editTitle') : t('manage.courseForm.newTitle')}
          </SheetTitle>
          <SheetDescription>
            {isEdit ? t('manage.courseForm.editDescription') : t('manage.courseForm.createDescription')}
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
                    placeholder={t('manage.courseForm.titlePlaceholder')}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <div className='grid gap-4 sm:grid-cols-2'>
              <Controller
                name='category'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className='gap-2'>
                    <FieldLabel htmlFor='category'>{t('manage.courseForm.categoryLabel')}</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id='category' className='w-full'>
                        <SelectValue placeholder={t('manage.courseForm.categoryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.code} value={category.code}>
                            {category.code} - {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {categories.length === 0 ? (
                      <FieldDescription>{t('manage.courseForm.noCategories')}</FieldDescription>
                    ) : null}
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />

              <Controller
                name='accessCode'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className='gap-2'>
                    <FieldLabel htmlFor='accessCode'>{t('manage.courseForm.accessLabel')}</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id='accessCode' className='w-full'>
                        <SelectValue placeholder={t('manage.courseForm.accessPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_ACCESS_CODES.map(code => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>{t('manage.courseForm.accessHint')}</FieldDescription>
                  </Field>
                )}
              />
            </div>

            <Controller
              name='cover'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('manage.courseForm.coverLabel')}</FieldLabel>
                  <Input {...field} id={field.name} placeholder={t('manage.courseForm.coverPlaceholder')} />
                  <FieldDescription>{t('manage.courseForm.coverHint')}</FieldDescription>
                </Field>
              )}
            />

            <Controller
              name='isPublic'
              control={form.control}
              render={({ field }) => (
                <Field orientation='horizontal' className='items-center justify-between gap-3'>
                  <div className='flex flex-col gap-0.5'>
                    <FieldLabel htmlFor='isPublic'>{t('manage.common.published')}</FieldLabel>
                    <FieldDescription>{t('manage.courseForm.publishedHint')}</FieldDescription>
                  </div>
                  <Switch id='isPublic' checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />
          </FieldGroup>

          <div className='flex flex-col gap-3'>
            <RepeaterHeader
              title={t('manage.courseForm.descriptions.title')}
              description={t('manage.courseForm.descriptions.description')}
              addLabel={t('manage.courseForm.descriptions.add')}
              onAdd={() => nextFreeLocale && descriptions.append({ locale: nextFreeLocale, value: '' })}
              disabled={!nextFreeLocale}
              disabledHint={t('manage.courseForm.descriptions.allUsed')}
            />

            {descriptions.fields.length === 0 ? (
              <RepeaterEmpty message={t('manage.courseForm.descriptions.empty')} />
            ) : (
              descriptions.fields.map((row, index) => (
                <RepeaterRow
                  key={row.id}
                  onRemove={() => descriptions.remove(index)}
                  removeLabel={t('manage.courseForm.descriptions.remove')}
                >
                  <Controller
                    name={`descriptions.${index}.locale`}
                    control={form.control}
                    render={({ field }) => (
                      <Field className='gap-2'>
                        <FieldLabel htmlFor={field.name}>{t('manage.common.locale')}</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id={field.name} className='w-full sm:w-32'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LOCALE_CODES.map(locale => (
                              <SelectItem key={locale} value={locale}>
                                {locale}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                  <Controller
                    name={`descriptions.${index}.value`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className='gap-2'>
                        <FieldLabel htmlFor={field.name}>{t('manage.common.text')}</FieldLabel>
                        <Textarea {...field} id={field.name} rows={3} aria-invalid={fieldState.invalid} />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                </RepeaterRow>
              ))
            )}

            {form.formState.errors.descriptions?.root ? (
              <FieldError errors={[form.formState.errors.descriptions.root]} />
            ) : null}
          </div>

          <SheetFooter className='flex-row justify-end gap-2 px-0'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type='submit'>
              {isEdit ? t('manage.courseForm.editSubmit') : t('manage.courseForm.createSubmit')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
