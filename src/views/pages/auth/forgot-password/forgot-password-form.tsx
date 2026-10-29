'use client'

// Component Import
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const ForgotPasswordForm = () => {
  const { t } = useTranslation()

  return (
    <form onSubmit={e => e.preventDefault()}>
      <FieldGroup className='gap-4'>
        {/* Email */}
        <Field>
          <FieldLabel className='leading-5' htmlFor='userEmail'>
            {t('auth.emailLabel')}
          </FieldLabel>
          <Input type='email' id='userEmail' placeholder={t('auth.emailPlaceholder')} />
        </Field>
        <Field>
          <Button className='w-full' type='submit'>
            {t('auth.forgotPassword.submit')}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default ForgotPasswordForm
