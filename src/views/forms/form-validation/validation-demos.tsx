'use client'

// React Imports
import * as React from 'react'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'

// Component Imports
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Hook Imports
import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string

// Built from `t` so the validation messages follow the active language.
const buildModeSchema = (t: Translate) => {
  const demoField = z
    .string()
    .min(5, t('forms.validation.errors.demoMin'))
    .max(20, t('forms.validation.errors.demoMax'))

  return z.object({
    onChange: demoField,
    onBlur: demoField,
    onSubmit: demoField,
    onTouched: demoField
  })
}

type ModeFormValues = z.infer<ReturnType<typeof buildModeSchema>>

const ValidationModesDemo = () => {
  const { t } = useTranslation()

  const modeSchema = React.useMemo(() => buildModeSchema(t), [t])

  // Form with onChange mode
  const onChangeForm = useForm<Pick<ModeFormValues, 'onChange'>>({
    resolver: zodResolver(z.object({ onChange: modeSchema.shape.onChange })),
    mode: 'onChange',
    defaultValues: {
      onChange: ''
    }
  })

  // Form with onBlur mode
  const onBlurForm = useForm<Pick<ModeFormValues, 'onBlur'>>({
    resolver: zodResolver(z.object({ onBlur: modeSchema.shape.onBlur })),
    mode: 'onBlur',
    defaultValues: {
      onBlur: ''
    }
  })

  // Form with onSubmit mode
  const onSubmitForm = useForm<Pick<ModeFormValues, 'onSubmit'>>({
    resolver: zodResolver(z.object({ onSubmit: modeSchema.shape.onSubmit })),
    mode: 'onSubmit',
    defaultValues: {
      onSubmit: ''
    }
  })

  // Form with onTouched mode
  const onTouchedForm = useForm<Pick<ModeFormValues, 'onTouched'>>({
    resolver: zodResolver(z.object({ onTouched: modeSchema.shape.onTouched })),
    mode: 'onTouched',
    defaultValues: {
      onTouched: ''
    }
  })

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h2 className='text-lg font-semibold'>{t('forms.modes.title')}</h2>
        <p className='text-muted-foreground'>{t('forms.modes.description')}</p>
      </div>

      <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-4'>
        {/* onChange Mode */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>{t('forms.modes.onChangeTitle')}</CardTitle>
            <CardDescription>{t('forms.modes.onChangeDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onChangeForm.handleSubmit(() => {
                alert(t('forms.modes.submittedAlert', { mode: 'onChange' }))
                onChangeForm.reset()
              })}
              className='space-y-4'
            >
              <Controller
                name='onChange'
                control={onChangeForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t('forms.modes.demoInput')}</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder={t('forms.modes.typeHere')}
                    />
                    <FieldDescription>
                      {t('forms.modes.onChangeHintBefore')} <strong>{t('forms.modes.onChangeHintStrong')}</strong>{' '}
                      {t('forms.modes.onChangeHintAfter')}
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <div className='flex gap-2'>
                <Button type='submit' size='sm'>
                  {t('common.submit')}
                </Button>
                <Button type='button' variant='outline' size='sm' onClick={() => onChangeForm.reset()}>
                  {t('common.reset')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* onBlur Mode */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>{t('forms.modes.onBlurTitle')}</CardTitle>
            <CardDescription>{t('forms.modes.onBlurDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onBlurForm.handleSubmit(() => {
                alert(t('forms.modes.submittedAlert', { mode: 'onBlur' }))
                onBlurForm.reset()
              })}
              className='space-y-4'
            >
              <Controller
                name='onBlur'
                control={onBlurForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t('forms.modes.demoInput')}</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder={t('forms.modes.typeHere')}
                    />
                    <FieldDescription>
                      {t('forms.modes.onBlurHintBefore')} <strong>{t('forms.modes.onBlurHintStrong')}</strong>{' '}
                      {t('forms.modes.onBlurHintAfter')}
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <div className='flex gap-2'>
                <Button type='submit' size='sm'>
                  {t('common.submit')}
                </Button>
                <Button type='button' variant='outline' size='sm' onClick={() => onBlurForm.reset()}>
                  {t('common.reset')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* onSubmit Mode */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>{t('forms.modes.onSubmitTitle')}</CardTitle>
            <CardDescription>{t('forms.modes.onSubmitDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onSubmitForm.handleSubmit(() => {
                alert(t('forms.modes.submittedAlert', { mode: 'onSubmit' }))
                onSubmitForm.reset()
              })}
              className='space-y-4'
            >
              <Controller
                name='onSubmit'
                control={onSubmitForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t('forms.modes.demoInput')}</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder={t('forms.modes.typeHere')}
                    />
                    <FieldDescription>
                      {t('forms.modes.onSubmitHintBefore')} <strong>{t('forms.modes.onSubmitHintStrong')}</strong>{' '}
                      {t('forms.modes.onSubmitHintAfter')}
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <div className='flex gap-2'>
                <Button type='submit' size='sm'>
                  {t('common.submit')}
                </Button>
                <Button type='button' variant='outline' size='sm' onClick={() => onSubmitForm.reset()}>
                  {t('common.reset')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* onTouched Mode */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>{t('forms.modes.onTouchedTitle')}</CardTitle>
            <CardDescription>{t('forms.modes.onTouchedDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onTouchedForm.handleSubmit(() => {
                alert(t('forms.modes.submittedAlert', { mode: 'onTouched' }))
                onTouchedForm.reset()
              })}
              className='space-y-4'
            >
              <Controller
                name='onTouched'
                control={onTouchedForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t('forms.modes.demoInput')}</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder={t('forms.modes.typeHere')}
                    />
                    <FieldDescription>
                      {t('forms.modes.onTouchedHintBefore')} <strong>{t('forms.modes.onTouchedHintStrong')}</strong>{' '}
                      {t('forms.modes.onTouchedHintAfter')}
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <div className='flex gap-2'>
                <Button type='submit' size='sm'>
                  {t('common.submit')}
                </Button>
                <Button type='button' variant='outline' size='sm' onClick={() => onTouchedForm.reset()}>
                  {t('common.reset')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <div className='overflow-hidden rounded-lg border'>
        <table className='w-full text-sm'>
          <thead className='bg-muted'>
            <tr>
              <th className='p-4 text-left font-semibold'>{t('forms.modes.tableMode')}</th>
              <th className='p-4 text-left font-semibold'>{t('forms.modes.tableWhen')}</th>
              <th className='p-4 text-left font-semibold'>{t('forms.modes.tableBestFor')}</th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            <tr className='hover:bg-muted/20 transition-colors'>
              <td className='p-4 font-medium'>onChange</td>
              <td className='p-4'>{t('forms.modes.onChangeWhen')}</td>
              <td className='p-4'>{t('forms.modes.onChangeBestFor')}</td>
            </tr>
            <tr className='hover:bg-muted/20 transition-colors'>
              <td className='p-4 font-medium'>onBlur</td>
              <td className='p-4'>{t('forms.modes.onBlurWhen')}</td>
              <td className='p-4'>{t('forms.modes.onBlurBestFor')}</td>
            </tr>
            <tr className='hover:bg-muted/20 transition-colors'>
              <td className='p-4 font-medium'>onSubmit</td>
              <td className='p-4'>{t('forms.modes.onSubmitWhen')}</td>
              <td className='p-4'>{t('forms.modes.onSubmitBestFor')}</td>
            </tr>
            <tr className='hover:bg-muted/20 transition-colors'>
              <td className='p-4 font-medium'>onTouched</td>
              <td className='p-4'>{t('forms.modes.onTouchedWhen')}</td>
              <td className='p-4'>{t('forms.modes.onTouchedBestFor')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ValidationModesDemo
