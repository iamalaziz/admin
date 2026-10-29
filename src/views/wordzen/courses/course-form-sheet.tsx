'use client'

import { useEffect } from 'react'

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
import type { Course, CoursePayload } from '@/types/wordzen/content-types'
import {
  COURSE_ACCESS_CODES,
  COURSE_CATEGORIES,
  COURSE_CATEGORY_CODES,
  LOCALE_CODES
} from '@/types/wordzen/content-types'

import { RepeaterEmpty, RepeaterHeader, RepeaterRow } from '../shared/repeater'

/** Mirrors `dto/request/CourseRequest`. `displayOrder` is left to the reorder endpoint. */
const courseFormSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters'),
  category: z.enum(COURSE_CATEGORY_CODES),
  accessCode: z.enum(COURSE_ACCESS_CODES),
  isPublic: z.boolean(),
  cover: z.string().trim(),
  descriptions: z
    .array(
      z.object({
        locale: z.enum(LOCALE_CODES),
        value: z.string().trim().min(1, 'Description cannot be empty')
      })
    )

    // One row per locale: `CourseDescription` is keyed by locale, so two RU rows would
    // mean two descriptions competing for the same slot on the learner side.
    .refine(rows => new Set(rows.map(row => row.locale)).size === rows.length, {
      message: 'Each locale can only appear once'
    })
})

type CourseFormValues = z.infer<typeof courseFormSchema>

const emptyValues: CourseFormValues = {
  title: '',
  category: 'A1',
  accessCode: 'FREE',
  isPublic: false,
  cover: '',
  descriptions: []
}

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
  const isEdit = course !== null

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: emptyValues
  })

  const descriptions = useFieldArray({ control: form.control, name: 'descriptions' })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(course ? toFormValues(course) : emptyValues)
  }, [course, form, open])

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
          <SheetTitle className='text-lg font-medium'>{isEdit ? 'Edit course' : 'New course'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Changes map to PUT /api/v1/manager/courses/{courseId}.'
              : 'Creates a course via POST /api/v1/manager/courses.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-5 px-4 pb-4'>
          <FieldGroup className='gap-4'>
            <Controller
              name='title'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                  <Input {...field} id={field.name} placeholder='Course title' aria-invalid={fieldState.invalid} />
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
                    <FieldLabel htmlFor='category'>Category</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id='category' className='w-full'>
                        <SelectValue placeholder='Select category' />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_CATEGORIES.map(category => (
                          <SelectItem key={category.code} value={category.code}>
                            {category.code} - {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />

              <Controller
                name='accessCode'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className='gap-2'>
                    <FieldLabel htmlFor='accessCode'>Access</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id='accessCode' className='w-full'>
                        <SelectValue placeholder='Select access' />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_ACCESS_CODES.map(code => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>Which subscription unlocks the course.</FieldDescription>
                  </Field>
                )}
              />
            </div>

            <Controller
              name='cover'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>Cover path</FieldLabel>
                  <Input {...field} id={field.name} placeholder='/courses/example.webp' />
                  <FieldDescription>
                    The path returned by POST /api/v1/manager/file/tmp/form. Clearing it is the DELETE /courses/
                    {'{courseId}'}/cover call.
                  </FieldDescription>
                </Field>
              )}
            />

            <Controller
              name='isPublic'
              control={form.control}
              render={({ field }) => (
                <Field orientation='horizontal' className='items-center justify-between gap-3'>
                  <div className='flex flex-col gap-0.5'>
                    <FieldLabel htmlFor='isPublic'>Published</FieldLabel>
                    <FieldDescription>A draft course is hidden from learners.</FieldDescription>
                  </div>
                  <Switch id='isPublic' checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />
          </FieldGroup>

          <div className='flex flex-col gap-3'>
            <RepeaterHeader
              title='Descriptions'
              description='One per locale, shown to learners in their language.'
              addLabel='Add locale'
              onAdd={() => nextFreeLocale && descriptions.append({ locale: nextFreeLocale, value: '' })}
              disabled={!nextFreeLocale}
              disabledHint='Every locale already has a description'
            />

            {descriptions.fields.length === 0 ? (
              <RepeaterEmpty message='No descriptions yet. The course list and learner app will show the title only.' />
            ) : (
              descriptions.fields.map((row, index) => (
                <RepeaterRow key={row.id} onRemove={() => descriptions.remove(index)} removeLabel='Remove description'>
                  <Controller
                    name={`descriptions.${index}.locale`}
                    control={form.control}
                    render={({ field }) => (
                      <Field className='gap-2'>
                        <FieldLabel htmlFor={field.name}>Locale</FieldLabel>
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
                        <FieldLabel htmlFor={field.name}>Text</FieldLabel>
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
              Cancel
            </Button>
            <Button type='submit'>{isEdit ? 'Save course' : 'Create course'}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
