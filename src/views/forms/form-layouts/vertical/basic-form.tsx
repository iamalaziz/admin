'use client'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const BasicForm = () => {
  const { t } = useTranslation()

  return (
    <form>
      <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-step-personal-info-first-name'>{t('forms.fields.firstName')}</FieldLabel>
          <Input id='multi-step-personal-info-first-name' placeholder={t('forms.placeholders.firstName')} />
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-step-personal-info-last-name'>{t('forms.fields.lastName')}</FieldLabel>
          <Input id='multi-step-personal-info-last-name' placeholder={t('forms.placeholders.lastName')} />
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-step-personal-info-mobile'>{t('forms.fields.mobile')}</FieldLabel>
          <Input id='multi-step-personal-info-mobile' placeholder={t('forms.placeholders.mobile')} />
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-step-personal-info-pincode'>{t('forms.fields.pincode')}</FieldLabel>
          <Input id='multi-step-personal-info-pincode' placeholder={t('forms.placeholders.pincode')} />
        </Field>

        <Field className='gap-2 sm:col-span-2'>
          <FieldLabel htmlFor='multi-step-personal-info-address'>{t('forms.fields.address')}</FieldLabel>
          <Input id='multi-step-personal-info-address' placeholder={t('forms.placeholders.address')} />
        </Field>

        <Field className='gap-2 sm:col-span-2'>
          <FieldLabel htmlFor='multi-step-personal-info-landmark'>{t('forms.fields.landmark')}</FieldLabel>
          <Input id='multi-step-personal-info-landmark' placeholder={t('forms.placeholders.landmark')} />
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-step-personal-info-city'>{t('forms.fields.city')}</FieldLabel>
          <Input id='multi-step-personal-info-city' placeholder={t('forms.placeholders.city')} />
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-step-personal-info-state'>{t('forms.fields.state')}</FieldLabel>
          <Input id='multi-step-personal-info-state' placeholder={t('forms.placeholders.state')} />
        </Field>
      </FieldGroup>

      <div className='mt-8'>
        <Button type='submit'>{t('forms.saveInformation')}</Button>
      </div>
    </form>
  )
}

export default BasicForm
