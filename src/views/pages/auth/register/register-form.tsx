'use client'

// React Import
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { EyeIcon, EyeOffIcon } from 'lucide-react'

// Component Import
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const RegisterForm = () => {
  const { t } = useTranslation()
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

  return (
    <form onSubmit={e => e.preventDefault()}>
      <FieldGroup className='gap-4'>
        {/* Username */}
        <Field className='gap-2'>
          <FieldLabel className='leading-5' htmlFor='username'>
            {t('auth.usernameLabel')}
          </FieldLabel>
          <Input type='text' id='username' placeholder={t('auth.usernamePlaceholder')} />
        </Field>
        {/* Email */}
        <Field className='gap-2'>
          <FieldLabel className='leading-5' htmlFor='userEmail'>
            {t('auth.emailLabel')}
          </FieldLabel>
          <Input type='email' id='userEmail' placeholder={t('auth.emailPlaceholder')} />
        </Field>
        {/* Password */}
        <Field className='w-full gap-2'>
          <FieldLabel className='leading-5' htmlFor='password'>
            {t('auth.passwordLabel')}
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
        <Field className='w-full gap-2'>
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
        {/* Privacy policy */}
        <Field orientation='horizontal' className='flex items-center gap-2'>
          <Checkbox id='privacyPolicy' />
          <FieldLabel htmlFor='privacyPolicy'>
            <span className='text-muted-foreground'>{t('auth.register.agreePrefix')}</span>{' '}
            <Link href='#'>{t('auth.register.privacyPolicy')}</Link>
          </FieldLabel>
        </Field>
        <Field>
          <Button className='w-full' type='submit'>
            {t('auth.register.submit')}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default RegisterForm
