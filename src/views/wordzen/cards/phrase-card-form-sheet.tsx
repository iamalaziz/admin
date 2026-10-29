'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { Module, PhraseCard, PhraseCardPayload } from '@/types/wordzen/content-types'
import { LOCALE_CODES } from '@/types/wordzen/content-types'

import { RepeaterEmpty, RepeaterHeader, RepeaterRow } from '../shared/repeater'

/** Mirrors `dto/request/PhraseCardRequest` and its nested explanations. */
const phraseCardFormSchema = z.object({
  text: z.string().trim().min(1, 'Phrase is required'),
  explanations: z.array(
    z.object({
      locale: z.enum(LOCALE_CODES),
      text: z.string().trim().min(1, 'Explanation cannot be empty')
    })
  )
})

type PhraseCardFormValues = z.infer<typeof phraseCardFormSchema>

const emptyValues: PhraseCardFormValues = {
  text: '',
  explanations: [{ locale: 'RU', text: '' }]
}

export interface PhraseCardFormSheetProps {
  open: boolean
  phraseCard: PhraseCard | null
  module: Module
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: PhraseCardPayload) => void
}

export function PhraseCardFormSheet({ open, phraseCard, module, onOpenChange, onSubmit }: PhraseCardFormSheetProps) {
  const isEdit = phraseCard !== null

  const form = useForm<PhraseCardFormValues>({
    resolver: zodResolver(phraseCardFormSchema),
    defaultValues: emptyValues
  })

  const explanations = useFieldArray({ control: form.control, name: 'explanations' })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(
      phraseCard
        ? {
            text: phraseCard.text,
            explanations: phraseCard.explanations.map(explanation => ({
              locale: explanation.locale,
              text: explanation.text
            }))
          }
        : emptyValues
    )
  }, [form, open, phraseCard])

  const handleSubmit = (values: PhraseCardFormValues) => {
    onSubmit({
      text: values.text,
      moduleId: module.id,
      displayOrder: phraseCard?.displayOrder ?? 0,
      explanations: values.explanations
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-[520px]'>
        <SheetHeader className='pb-0'>
          <SheetTitle className='text-lg font-medium'>{isEdit ? 'Edit phrase card' : 'New phrase card'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Changes map to PUT /api/v1/manager/phrase-cards/{phraseCardId}.'
              : `Creates a phrase card in "${module.title}" via POST /api/v1/manager/phrase-cards.`}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-5 px-4 pb-4'>
          <FieldGroup className='gap-4'>
            <Controller
              name='text'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>Phrase</FieldLabel>
                  <Input {...field} id={field.name} placeholder='break the ice' aria-invalid={fieldState.invalid} />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <div className='flex flex-col gap-3'>
            <RepeaterHeader
              title='Explanations'
              description='How the phrase is used, per locale.'
              addLabel='Add explanation'
              onAdd={() => explanations.append({ locale: 'RU', text: '' })}
            />

            {explanations.fields.length === 0 ? (
              <RepeaterEmpty message='No explanations yet.' />
            ) : (
              explanations.fields.map((row, index) => (
                <RepeaterRow key={row.id} onRemove={() => explanations.remove(index)} removeLabel='Remove explanation'>
                  <Controller
                    name={`explanations.${index}.locale`}
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
                    name={`explanations.${index}.text`}
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
          </div>

          <SheetFooter className='flex-row justify-end gap-2 px-0'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit'>{isEdit ? 'Save phrase card' : 'Create phrase card'}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
