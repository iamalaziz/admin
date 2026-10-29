'use client'

// React imports
import { useState } from 'react'

// Third-party Imports
import { EyeIcon, EyeOffIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const ResetPasswordForm = () => {
  const { t } = useTranslation()
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

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

        {/* Password */}
        <Field>
          <FieldLabel className='leading-5' htmlFor='password'>
            {t('auth.newPasswordLabel')}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id='password'
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder='••••••••••••••••'
            />
            <InputGroupAddon align='inline-end' className='pr-1.5'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setIsPasswordVisible(prevState => !prevState)}
                className='text-muted-foreground rounded-l-none hover:bg-transparent'
              >
                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                <span className='sr-only'>
                  {isPasswordVisible ? t('common.hidePassword') : t('common.showPassword')}
                </span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>

        {/* Confirm Password */}
        <Field>
          <FieldLabel className='leading-5' htmlFor='confirmPassword'>
            {t('auth.confirmPasswordLabel')}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id='confirmPassword'
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              placeholder='••••••••••••••••'
            />
            <InputGroupAddon align='inline-end' className='pr-1.5'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setIsConfirmPasswordVisible(prevState => !prevState)}
                className='text-muted-foreground rounded-l-none hover:bg-transparent'
              >
                {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                <span className='sr-only'>
                  {isConfirmPasswordVisible ? t('common.hidePassword') : t('common.showPassword')}
                </span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Field>
          <Button className='w-full' type='submit'>
            {t('auth.resetPassword.submit')}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default ResetPasswordForm
