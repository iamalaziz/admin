'use client'

// Component Imports
import RegistrationForm from './registration-demo-form'
import ValidationModesDemo from './validation-demos'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const FormValidation = () => {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-8'>
      <div className='space-y-3'>
        <h2 className='text-lg font-semibold'>{t('forms.validation.registrationFormTitle')}</h2>
        <RegistrationForm />
      </div>
      <ValidationModesDemo />
    </div>
  )
}

export default FormValidation
