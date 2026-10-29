'use client'

// Component Imports
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const TwoStepsV1Form = () => {
  const { t } = useTranslation()

  return (
    <form onSubmit={e => e.preventDefault()}>
      <FieldGroup className='gap-4'>
        <Field className='gap-4'>
          <div className='flex items-center justify-between gap-1'>
            <FieldLabel htmlFor='recoveryCode' className='text-base'>
              {t('auth.twoSteps.codeLabel')}
            </FieldLabel>
            <span className='text-base font-medium'>{t('auth.twoSteps.useRecoveryCode')}</span>
          </div>

          <InputOTP id='recoveryCode' maxLength={6}>
            <InputOTPGroup className='w-full justify-center gap-4 *:data-[slot=input-otp-slot]:rounded-lg *:data-[slot=input-otp-slot]:border'>
              <InputOTPSlot index={0} className='input-size-lg' />
              <InputOTPSlot index={1} className='input-size-lg' />
              <InputOTPSlot index={2} className='input-size-lg' />
              <InputOTPSlot index={3} className='input-size-lg' />
              <InputOTPSlot index={4} className='input-size-lg' />
              <InputOTPSlot index={5} className='input-size-lg' />
            </InputOTPGroup>
          </InputOTP>
        </Field>

        <Field>
          <Button size='lg' className='w-full' type='submit'>
            {t('auth.twoSteps.submit')}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default TwoStepsV1Form
