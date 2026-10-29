'use client'

import { useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/lib/i18n'
import type { Translate } from '@/lib/i18n'
import type { Module, PhraseCard, PhraseCardPayload } from '@/types/wordzen/content-types'
import { LOCALE_CODES } from '@/types/wordzen/content-types'

import { RepeaterEmpty, RepeaterHeader, RepeaterRow } from '../shared/repeater'

/** Mirrors `dto/request/PhraseCardRequest` and its nested explanations. */
const createPhraseCardFormSchema = (t: Translate) =>
  z.object({
    text: z.string().trim().min(1, t('manage.phraseCardForm.validation.phraseRequired')),
    explanations: z.array(
      z.object({
        locale: z.enum(LOCALE_CODES),
        text: z.string().trim().min(1, t('manage.phraseCardForm.validation.explanationRequired'))
      })
    )
  })

type PhraseCardFormValues = z.infer<ReturnType<typeof createPhraseCardFormSchema>>

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
  const { t } = useTranslation()
  const isEdit = phraseCard !== null

  const schema = useMemo(() => createPhraseCardFormSchema(t), [t])

  const form = useForm<PhraseCardFormValues>({
    resolver: zodResolver(schema),
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
          <SheetTitle className='text-lg font-medium'>
            {isEdit ? t('manage.phraseCardForm.editTitle') : t('manage.phraseCardForm.newTitle')}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? t('manage.phraseCardForm.editDescription')
              : t('manage.phraseCardForm.createDescription', { module: module.title })}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-5 px-4 pb-4'>
          <FieldGroup className='gap-4'>
            <Controller
              name='text'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2'>
                  <FieldLabel htmlFor={field.name}>{t('manage.phraseCardForm.phraseLabel')}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder={t('manage.phraseCardForm.phrasePlaceholder')}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <div className='flex flex-col gap-3'>
            <RepeaterHeader
              title={t('manage.phraseCardForm.explanations.title')}
              description={t('manage.phraseCardForm.explanations.description')}
              addLabel={t('manage.phraseCardForm.explanations.add')}
              onAdd={() => explanations.append({ locale: 'RU', text: '' })}
            />

            {explanations.fields.length === 0 ? (
              <RepeaterEmpty message={t('manage.phraseCardForm.explanations.empty')} />
            ) : (
              explanations.fields.map((row, index) => (
                <RepeaterRow
                  key={row.id}
                  onRemove={() => explanations.remove(index)}
                  removeLabel={t('manage.phraseCardForm.explanations.remove')}
                >
                  <Controller
                    name={`explanations.${index}.locale`}
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
                    name={`explanations.${index}.text`}
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
          </div>

          <SheetFooter className='flex-row justify-end gap-2 px-0'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type='submit'>
              {isEdit ? t('manage.phraseCardForm.editSubmit') : t('manage.phraseCardForm.createSubmit')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
