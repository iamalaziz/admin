'use client'

// Rect Import
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { EyeIcon, EyeOffIcon } from 'lucide-react'

// Components Import
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const LoginForm = () => {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  return (
    <form onSubmit={e => e.preventDefault()}>
      <FieldGroup className='gap-4'>
        {/* Email */}
        <Field className='gap-2'>
          <FieldLabel htmlFor='userEmail' className='leading-5'>
            {t('auth.emailLabel')}
          </FieldLabel>
          <Input type='email' id='userEmail' placeholder={t('auth.emailPlaceholder')} />
        </Field>
        {/* Password */}
        <Field className='w-full gap-2'>
          <FieldLabel htmlFor='password' className='leading-5'>
            {t('auth.passwordLabel')}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput id='password' type={isVisible ? 'text' : 'password'} placeholder='••••••••••••••••' />
            <InputGroupAddon align='inline-end' className='pr-1.5'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setIsVisible(prevState => !prevState)}
                className='text-muted-foreground rounded-l-none hover:bg-transparent'
              >
                {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                <span className='sr-only'>{isVisible ? t('common.hidePassword') : t('common.showPassword')}</span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        {/* Remember Me and Forgot Password */}
        <div className='flex items-center justify-between gap-y-2'>
          <Field orientation='horizontal' className='flex items-center gap-2'>
            <Checkbox id='rememberMe' />
            <FieldLabel htmlFor='rememberMe' className='text-muted-foreground'>
              {' '}
              {t('auth.login.rememberMe')}
            </FieldLabel>
          </Field>
          <Link href='/pages/auth/forgot-password' className='text-base text-nowrap hover:underline'>
            {t('auth.login.forgotPassword')}
          </Link>
        </div>
        <Field>
          <Button className='w-full' type='submit'>
            {t('auth.login.submit')}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default LoginForm
