'use client'

import { useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/lib/i18n'
import type { Translate } from '@/lib/i18n'
import type { Card, CardPayload, Module } from '@/types/wordzen/content-types'
import { LOCALE_CODES } from '@/types/wordzen/content-types'

import { RepeaterEmpty, RepeaterHeader, RepeaterRow } from '../shared/repeater'

/** Mirrors `dto/request/CardRequest`, including its nested translations and samples. */
const createCardFormSchema = (t: Translate) =>
  z.object({
    term: z.string().trim().min(1, t('manage.cardForm.validation.termRequired')),
    image: z.string().trim(),
    translations: z
      .array(
        z.object({
          locale: z.enum(LOCALE_CODES),
          value: z.string().trim().min(1, t('manage.cardForm.validation.translationRequired'))
        })
      )

      // A card with no gloss teaches nothing, so unlike samples this list cannot be empty.
      .min(1, t('manage.cardForm.validation.translationsMin')),
    samples: z.array(
      z.object({
        locale: z.enum(LOCALE_CODES),
        value: z.string().trim().min(1, t('manage.cardForm.validation.sentenceRequired')),
        translation: z.string().trim().min(1, t('manage.cardForm.validation.sentenceTranslationRequired'))
      })
    )
  })

type CardFormValues = z.infer<ReturnType<typeof createCardFormSchema>>

const emptyValues: CardFormValues = {
  term: '',
  image: '',
  translations: [{ locale: 'RU', value: '' }],
  samples: []
}

const toFormValues = (card: Card): CardFormValues => ({
  term: card.term,
  image: card.image ?? '',
  translations: card.translations.map(translation => ({
    locale: translation.locale,
    value: translation.value
  })),
  samples: card.samples.map(sample => ({
    locale: sample.locale,
    value: sample.value,
    translation: sample.translation
  }))
})

export interface CardFormSheetProps {
  open: boolean
  card: Card | null
  module: Module
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: CardPayload) => void
}

export function CardFormSheet({ open, card, module, onOpenChange, onSubmit }: CardFormSheetProps) {
  const { t } = useTranslation()
  const isEdit = card !== null

  const schema = useMemo(() => createCardFormSchema(t), [t])

  const form = useForm<CardFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues
  })

  const translations = useFieldArray({ control: form.control, name: 'translations' })
  const samples = useFieldArray({ control: form.control, name: 'samples' })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(card ? toFormValues(card) : emptyValues)
  }, [card, form, open])

  const handleSubmit = (values: CardFormValues) => {
    onSubmit({
      term: values.term,
      image: values.image.trim() ? values.image.trim() : null,
      moduleId: module.id,
      displayOrder: card?.displayOrder ?? 0,
      translations: values.translations,
      samples: values.samples
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-[560px]'>
        <SheetHeader className='pb-0'>
          <SheetTitle className='text-lg font-medium'>
            {isEdit ? t('manage.cardForm.editTitle') : t('manage.cardForm.newTitle')}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? t('manage.cardForm.editDescription')
              : t('manage.cardForm.createDescription', { module: module.title })}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-5 px-4 pb-4'>
          <FieldGroup className='gap-4'>
            <Controller
              name='term'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('manage.cardForm.termLabel')}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder={t('manage.cardForm.termPlaceholder')}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name='image'
              control={form.control}
              render={({ field }) => (
                <Field className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('manage.cardForm.imageLabel')}</FieldLabel>
                  <Input {...field} id={field.name} placeholder={t('manage.cardForm.imagePlaceholder')} />
                  <FieldDescription>{t('manage.cardForm.imageHint')}</FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>

          <div className='flex flex-col gap-3'>
            <RepeaterHeader
              title={t('manage.cardForm.translations.title')}
              description={t('manage.cardForm.translations.description')}
              addLabel={t('manage.cardForm.translations.add')}
              onAdd={() => translations.append({ locale: 'RU', value: '' })}
            />

            {translations.fields.map((row, index) => (
              <RepeaterRow
                key={row.id}
                onRemove={() => translations.remove(index)}
                removeLabel={t('manage.cardForm.translations.remove')}
              >
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start'>
                  <Controller
                    name={`translations.${index}.locale`}
                    control={form.control}
                    render={({ field }) => (
                      <Field className='gap-2 sm:w-28'>
                        <FieldLabel htmlFor={field.name}>{t('manage.common.locale')}</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id={field.name} className='w-full'>
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
                    name={`translations.${index}.value`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className='min-w-0 flex-1 gap-2'>
                        <FieldLabel htmlFor={field.name}>{t('manage.cardForm.translations.value')}</FieldLabel>
                        <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                </div>
              </RepeaterRow>
            ))}

            {form.formState.errors.translations?.root ? (
              <FieldError errors={[form.formState.errors.translations.root]} />
            ) : null}
          </div>

          <div className='flex flex-col gap-3'>
            <RepeaterHeader
              title={t('manage.cardForm.samples.title')}
              description={t('manage.cardForm.samples.description')}
              addLabel={t('manage.cardForm.samples.add')}
              onAdd={() => samples.append({ locale: 'RU', value: '', translation: '' })}
            />

            {samples.fields.length === 0 ? (
              <RepeaterEmpty message={t('manage.cardForm.samples.empty')} />
            ) : (
              samples.fields.map((row, index) => (
                <RepeaterRow
                  key={row.id}
                  onRemove={() => samples.remove(index)}
                  removeLabel={t('manage.cardForm.samples.remove')}
                >
                  <Controller
                    name={`samples.${index}.locale`}
                    control={form.control}
                    render={({ field }) => (
                      <Field className='gap-2 sm:w-28'>
                        <FieldLabel htmlFor={field.name}>{t('manage.common.locale')}</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id={field.name} className='w-full'>
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
                    name={`samples.${index}.value`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className='gap-2'>
                        <FieldLabel htmlFor={field.name}>{t('manage.cardForm.samples.sentence')}</FieldLabel>
                        <Textarea {...field} id={field.name} rows={2} aria-invalid={fieldState.invalid} />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                  <Controller
                    name={`samples.${index}.translation`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className='gap-2'>
                        <FieldLabel htmlFor={field.name}>{t('manage.cardForm.samples.translation')}</FieldLabel>
                        <Textarea {...field} id={field.name} rows={2} aria-invalid={fieldState.invalid} />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                </RepeaterRow>
              ))
            )}
          </div>

          <SheetFooter className='flex-row justify-end gap-2 px-0'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type='submit'>
              {isEdit ? t('manage.cardForm.editSubmit') : t('manage.cardForm.createSubmit')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
