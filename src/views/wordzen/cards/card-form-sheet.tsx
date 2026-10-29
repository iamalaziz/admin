'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { Card, CardPayload, Module } from '@/types/wordzen/content-types'
import { LOCALE_CODES } from '@/types/wordzen/content-types'

import { RepeaterEmpty, RepeaterHeader, RepeaterRow } from '../shared/repeater'

/** Mirrors `dto/request/CardRequest`, including its nested translations and samples. */
const cardFormSchema = z.object({
  term: z.string().trim().min(1, 'Term is required'),
  image: z.string().trim(),
  translations: z
    .array(
      z.object({
        locale: z.enum(LOCALE_CODES),
        value: z.string().trim().min(1, 'Translation cannot be empty')
      })
    )

    // A card with no gloss teaches nothing, so unlike samples this list cannot be empty.
    .min(1, 'Add at least one translation'),
  samples: z.array(
    z.object({
      locale: z.enum(LOCALE_CODES),
      value: z.string().trim().min(1, 'Sentence cannot be empty'),
      translation: z.string().trim().min(1, 'Sentence translation cannot be empty')
    })
  )
})

type CardFormValues = z.infer<typeof cardFormSchema>

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
  const isEdit = card !== null

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
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
          <SheetTitle className='text-lg font-medium'>{isEdit ? 'Edit card' : 'New card'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Changes map to PUT /api/v1/manager/cards/{cardId}.'
              : `Creates a card in "${module.title}" via POST /api/v1/manager/cards.`}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-5 px-4 pb-4'>
          <FieldGroup className='gap-4'>
            <Controller
              name='term'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>Term</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder='The word being taught'
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
                  <FieldLabel htmlFor={field.name}>Image path</FieldLabel>
                  <Input {...field} id={field.name} placeholder='/cards/example.webp' />
                  <FieldDescription>
                    From POST /api/v1/manager/file/tmp/form, or generated via /manager/generate/img. Clearing it is the
                    DELETE /cards/{'{cardId}'}/image call.
                  </FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>

          <div className='flex flex-col gap-3'>
            <RepeaterHeader
              title='Translations'
              description='What the term means, per locale.'
              addLabel='Add translation'
              onAdd={() => translations.append({ locale: 'RU', value: '' })}
            />

            {translations.fields.map((row, index) => (
              <RepeaterRow key={row.id} onRemove={() => translations.remove(index)} removeLabel='Remove translation'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start'>
                  <Controller
                    name={`translations.${index}.locale`}
                    control={form.control}
                    render={({ field }) => (
                      <Field className='gap-2 sm:w-28'>
                        <FieldLabel htmlFor={field.name}>Locale</FieldLabel>
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
                        <FieldLabel htmlFor={field.name}>Value</FieldLabel>
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
              title='Samples'
              description='Example sentences and their translation.'
              addLabel='Add sample'
              onAdd={() => samples.append({ locale: 'RU', value: '', translation: '' })}
            />

            {samples.fields.length === 0 ? (
              <RepeaterEmpty message='No samples. The card will show the term and its translations only.' />
            ) : (
              samples.fields.map((row, index) => (
                <RepeaterRow key={row.id} onRemove={() => samples.remove(index)} removeLabel='Remove sample'>
                  <Controller
                    name={`samples.${index}.locale`}
                    control={form.control}
                    render={({ field }) => (
                      <Field className='gap-2 sm:w-28'>
                        <FieldLabel htmlFor={field.name}>Locale</FieldLabel>
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
                        <FieldLabel htmlFor={field.name}>Sentence</FieldLabel>
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
                        <FieldLabel htmlFor={field.name}>Translation</FieldLabel>
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
              Cancel
            </Button>
            <Button type='submit'>{isEdit ? 'Save card' : 'Create card'}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
