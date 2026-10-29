'use client'

// Component Imports
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Textarea } from '@/components/ui/textarea'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const BasicForm = () => {
  const { t } = useTranslation()

  return (
    <form>
      <FieldGroup className='gap-6'>
        <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
          <FieldLabel htmlFor='horizontal-basic-name'>{t('forms.fields.name')}</FieldLabel>
          <Input id='horizontal-basic-name' className='sm:col-span-5' placeholder={t('forms.placeholders.name')} />
        </Field>

        <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
          <FieldLabel htmlFor='horizontal-basic-company'>{t('forms.fields.company')}</FieldLabel>
          <Input
            id='horizontal-basic-company'
            className='sm:col-span-5'
            placeholder={t('forms.placeholders.company')}
          />
        </Field>

        <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
          <FieldLabel htmlFor='horizontal-basic-email'>{t('forms.fields.email')}</FieldLabel>
          <InputGroup className='sm:col-span-5'>
            <InputGroupInput id='horizontal-basic-email' placeholder={t('forms.placeholders.emailLocalPart')} />
            <InputGroupAddon align='inline-end' className='text-foreground font-normal'>
              @example.com
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
          <FieldLabel htmlFor='horizontal-basic-phone'>{t('forms.fields.phoneNo')}</FieldLabel>
          <Input
            id='horizontal-basic-phone'
            className='sm:col-span-5'
            type='tel'
            placeholder={t('forms.placeholders.phone')}
          />
        </Field>

        <Field className='grid grid-cols-1 items-start gap-2 sm:grid-cols-6'>
          <FieldLabel htmlFor='horizontal-basic-message'>{t('forms.fields.message')}</FieldLabel>
          <Textarea
            id='horizontal-basic-message'
            className='sm:col-span-5'
            placeholder={t('forms.placeholders.message')}
            rows={4}
          />
        </Field>

        <Field className='grid grid-cols-1 sm:grid-cols-6'>
          <div className='sm:col-start-2'>
            <Button type='submit'>{t('forms.send')}</Button>
          </div>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default BasicForm
