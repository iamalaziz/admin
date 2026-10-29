'use client'

// Third-party Imports
import { Building2Icon, MapIcon, MapPinIcon, PhoneIcon, SignpostIcon, UserIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const BasicFormWithIcon = () => {
  const { t } = useTranslation()

  return (
    <form>
      <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <Field className='gap-2'>
          <FieldLabel htmlFor='basic-with-icons-first-name'>{t('forms.fields.firstName')}</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <UserIcon className='size-4' />
              <span className='sr-only'>{t('forms.fields.firstName')}</span>
            </InputGroupAddon>
            <InputGroupInput id='basic-with-icons-first-name' placeholder={t('forms.placeholders.firstName')} />
          </InputGroup>
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='basic-with-icons-last-name'>{t('forms.fields.lastName')}</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <UserIcon className='size-4' />
              <span className='sr-only'>{t('forms.fields.lastName')}</span>
            </InputGroupAddon>
            <InputGroupInput id='basic-with-icons-last-name' placeholder={t('forms.placeholders.lastName')} />
          </InputGroup>
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='basic-with-icons-mobile'>{t('forms.fields.mobile')}</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <PhoneIcon className='size-4' />
              <span className='sr-only'>{t('forms.fields.mobile')}</span>
            </InputGroupAddon>
            <InputGroupInput id='basic-with-icons-mobile' type='tel' placeholder={t('forms.placeholders.mobile')} />
          </InputGroup>
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='basic-with-icons-pincode'>{t('forms.fields.pincode')}</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MapPinIcon className='size-4' />
              <span className='sr-only'>{t('forms.fields.pincode')}</span>
            </InputGroupAddon>
            <InputGroupInput id='basic-with-icons-pincode' placeholder={t('forms.placeholders.pincode')} />
          </InputGroup>
        </Field>

        <Field className='gap-2 sm:col-span-2'>
          <FieldLabel htmlFor='basic-with-icons-address'>{t('forms.fields.address')}</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MapPinIcon className='size-4' />
              <span className='sr-only'>{t('forms.fields.address')}</span>
            </InputGroupAddon>
            <InputGroupInput id='basic-with-icons-address' placeholder={t('forms.placeholders.address')} />
          </InputGroup>
        </Field>

        <Field className='gap-2 sm:col-span-2'>
          <FieldLabel htmlFor='basic-with-icons-landmark'>{t('forms.fields.landmark')}</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <SignpostIcon className='size-4' />
              <span className='sr-only'>{t('forms.fields.landmark')}</span>
            </InputGroupAddon>
            <InputGroupInput id='basic-with-icons-landmark' placeholder={t('forms.placeholders.landmark')} />
          </InputGroup>
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='basic-with-icons-city'>{t('forms.fields.city')}</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Building2Icon className='size-4' />
              <span className='sr-only'>{t('forms.fields.city')}</span>
            </InputGroupAddon>
            <InputGroupInput id='basic-with-icons-city' placeholder={t('forms.placeholders.city')} />
          </InputGroup>
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='basic-with-icons-state'>{t('forms.fields.state')}</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MapIcon className='size-4' />
              <span className='sr-only'>{t('forms.fields.state')}</span>
            </InputGroupAddon>
            <InputGroupInput id='basic-with-icons-state' placeholder={t('forms.placeholders.state')} />
          </InputGroup>
        </Field>
      </FieldGroup>

      <div className='mt-8'>
        <Button type='submit'>{t('forms.saveInformation')}</Button>
      </div>
    </form>
  )
}

export default BasicFormWithIcon
