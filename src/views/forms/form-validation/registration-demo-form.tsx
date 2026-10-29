'use client'

import * as React from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { CheckCheckIcon } from 'lucide-react'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// Hook Imports
import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string

// Built from `t` so the validation messages follow the active language.
const buildFormSchema = (t: Translate) =>
  z.object({
    name: z.string().min(2, t('forms.validation.errors.nameMin')),
    phone: z
      .string()
      .min(1, t('forms.validation.errors.phoneRequired'))
      .regex(/^\+?[0-9()\-\s]{8,20}$/, t('forms.validation.errors.phoneInvalid')),
    company: z.string().min(2, t('forms.validation.errors.companyMin')),
    email: z
      .string()
      .min(1, t('forms.validation.errors.emailRequired'))
      .email({ message: t('forms.validation.errors.emailInvalid') }),
    orderId: z.string().min(3, t('forms.validation.errors.orderIdRequired')),
    issue: z.string().min(1, {
      message: t('forms.validation.errors.issueRequired')
    }),
    department: z.string().min(1, {
      message: t('forms.validation.errors.departmentRequired')
    }),
    priority: z.string().min(1, {
      message: t('forms.validation.errors.priorityRequired')
    }),
    selectedOption: z.enum(['replace', 'refund', 'support'], {
      required_error: t('forms.validation.errors.optionRequired')
    }),
    message: z.string().min(50, t('forms.validation.errors.messageMin'))
  })

type FormValues = z.infer<ReturnType<typeof buildFormSchema>>

const ContactUSFormDemo = () => {
  const { t } = useTranslation()

  const formSchema = React.useMemo(() => buildFormSchema(t), [t])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      company: '',
      email: '',
      orderId: '',
      issue: '',
      department: '',
      priority: '',
      selectedOption: undefined,
      message: ''
    }
  })

  function onSubmit() {
    toast.custom(() => (
      <Alert className='border-green-600 text-green-600 sm:w-122 dark:border-green-400 dark:text-green-400 *:[svg]:row-span-1'>
        <CheckCheckIcon />
        <AlertTitle>{t('forms.validation.submittedToast')}</AlertTitle>
      </Alert>
    ))
  }

  return (
    <Card className='w-full shadow-none'>
      <CardHeader>
        <CardTitle>{t('forms.validation.reportIssue')}</CardTitle>
        <CardDescription>{t('forms.validation.reportIssueDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className='grid w-full grid-cols-1 gap-6 md:grid-cols-2'>
          <Controller
            name='name'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>{t('forms.fields.name')}</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t('forms.validation.namePlaceholder')}
                  autoComplete='name'
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='phone'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>{t('forms.fields.phone')}</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type='tel'
                  aria-invalid={fieldState.invalid}
                  placeholder={t('forms.validation.phonePlaceholder')}
                  autoComplete='tel'
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='company'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>{t('forms.fields.company')}</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t('forms.validation.companyPlaceholder')}
                  autoComplete='organization'
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Email Field */}
          <Controller
            name='email'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>{t('forms.fields.email')}</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type='email'
                  aria-invalid={fieldState.invalid}
                  placeholder={t('forms.validation.emailPlaceholder')}
                  autoComplete='email'
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='orderId'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>{t('forms.validation.orderId')}</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t('forms.validation.orderIdPlaceholder')}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Issue Select Field */}
          <Controller
            name='issue'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='issue'>{t('forms.validation.issue')}</FieldLabel>
                <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id='issue' className='w-full' aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder={t('forms.validation.issuePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='damaged'>{t('forms.validation.issueOptions.damaged')}</SelectItem>
                    <SelectItem value='got-different'>{t('forms.validation.issueOptions.got-different')}</SelectItem>
                    <SelectItem value='not-like'>{t('forms.validation.issueOptions.not-like')}</SelectItem>
                    <SelectItem value='other'>{t('forms.validation.issueOptions.other')}</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='department'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='department'>{t('forms.validation.department')}</FieldLabel>
                <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id='department' className='w-full' aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder={t('forms.validation.departmentPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='sales'>{t('forms.validation.departmentOptions.sales')}</SelectItem>
                    <SelectItem value='billing'>{t('forms.validation.departmentOptions.billing')}</SelectItem>
                    <SelectItem value='returns'>{t('forms.validation.departmentOptions.returns')}</SelectItem>
                    <SelectItem value='technical'>{t('forms.validation.departmentOptions.technical')}</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='priority'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='priority'>{t('forms.validation.priority')}</FieldLabel>
                <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id='priority' className='w-full' aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder={t('forms.validation.priorityPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='low'>{t('forms.validation.priorityOptions.low')}</SelectItem>
                    <SelectItem value='medium'>{t('forms.validation.priorityOptions.medium')}</SelectItem>
                    <SelectItem value='high'>{t('forms.validation.priorityOptions.high')}</SelectItem>
                    <SelectItem value='urgent'>{t('forms.validation.priorityOptions.urgent')}</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Radio Group Field */}
          <Controller
            name='selectedOption'
            control={form.control}
            render={({ field, fieldState }) => (
              <FieldSet className='md:col-span-2'>
                <FieldLegend variant='label'>{t('forms.validation.howCanWeHelp')}</FieldLegend>
                <RadioGroup name={field.name} value={field.value ?? ''} onValueChange={field.onChange}>
                  <Field orientation='horizontal' data-invalid={fieldState.invalid}>
                    <RadioGroupItem value='replace' id='want-replace' aria-invalid={fieldState.invalid} />
                    <FieldLabel htmlFor='want-replace' className='font-normal'>
                      {t('forms.validation.optionReplace')}
                    </FieldLabel>
                  </Field>
                  <Field orientation='horizontal' data-invalid={fieldState.invalid}>
                    <RadioGroupItem value='refund' id='want-refund' aria-invalid={fieldState.invalid} />
                    <FieldLabel htmlFor='want-refund' className='font-normal'>
                      {t('forms.validation.optionRefund')}
                    </FieldLabel>
                  </Field>
                  <Field orientation='horizontal' data-invalid={fieldState.invalid}>
                    <RadioGroupItem value='support' id='want-support' aria-invalid={fieldState.invalid} />
                    <FieldLabel htmlFor='want-support' className='font-normal'>
                      {t('forms.validation.optionSupport')}
                    </FieldLabel>
                  </Field>
                </RadioGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </FieldSet>
            )}
          />

          {/* Message Textarea Field */}
          <Controller
            name='message'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='md:col-span-2'>
                <FieldLabel htmlFor={field.name}>{t('forms.validation.describeIssue')}</FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t('forms.validation.describeIssuePlaceholder')}
                  className='min-h-30 resize-none'
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Button type='submit' className='md:col-span-2 md:w-fit'>
            {t('common.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default ContactUSFormDemo
