'use client'

// React Imports
import { useMemo, useState } from 'react'

// Third-party Imports
import { CheckIcon, EyeIcon, EyeOffIcon, MailIcon, XIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'

// Util Imports
import { cn } from '@/lib/utils'

// Hook Imports
import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const requirements: { regex: RegExp; textKey: TranslationKey }[] = [
  { regex: /.{12,}/, textKey: 'settings.emailPassword.requirements.length' },
  { regex: /[a-z]/, textKey: 'settings.emailPassword.requirements.lowercase' },
  { regex: /[A-Z]/, textKey: 'settings.emailPassword.requirements.uppercase' },
  { regex: /[0-9]/, textKey: 'settings.emailPassword.requirements.number' },
  {
    regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/,
    textKey: 'settings.emailPassword.requirements.special'
  }
]

const EmailPass = () => {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  const [password, setPassword] = useState('')

  const toggleVisibility = () => setIsVisible(prevState => !prevState)

  const strength = requirements.map(req => ({
    met: req.regex.test(password),
    textKey: req.textKey
  }))

  const strengthScore = useMemo(() => {
    return strength.filter(req => req.met).length
  }, [strength])

  const getColor = (score: number) => {
    if (score === 0) return 'bg-border'
    if (score <= 1) return 'bg-destructive'
    if (score <= 2) return 'bg-orange-500 '
    if (score <= 3) return 'bg-amber-500'
    if (score === 4) return 'bg-yellow-400'

    return 'bg-green-500'
  }

  const getText = (score: number) => {
    if (score === 0) return t('settings.emailPassword.strength.empty')
    if (score <= 2) return t('settings.emailPassword.strength.weak')
    if (score <= 3) return t('settings.emailPassword.strength.medium')
    if (score === 4) return t('settings.emailPassword.strength.strong')

    return t('settings.emailPassword.strength.veryStrong')
  }

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>{t('settings.emailPassword.title')}</h3>
        <p className='text-muted-foreground text-sm'>{t('settings.emailPassword.description')}</p>
      </div>

      {/* Content */}
      <div className='lg:col-span-2'>
        <form className='mx-auto space-y-6'>
          <div className='w-full space-y-2'>
            <Label htmlFor='email' className='gap-1'>
              {t('settings.emailPassword.email')}
              <span className='text-destructive'>*</span>
            </Label>
            <InputGroup>
              <InputGroupInput
                id='email'
                type='email'
                placeholder={t('settings.emailPassword.emailPlaceholder')}
                required
              />
              <InputGroupAddon align='inline-end' className='pr-2.75'>
                <MailIcon className='size-4' />
                <span className='sr-only'>{t('settings.emailPassword.email')}</span>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className='w-full space-y-2'>
            <Label htmlFor='current-password' className='gap-1'>
              {t('settings.emailPassword.currentPassword')}
              <span className='text-destructive'>*</span>
            </Label>
            <InputGroup>
              <InputGroupInput
                id='current-password'
                type={isVisible ? 'text' : 'password'}
                placeholder={t('settings.emailPassword.passwordPlaceholder')}
                required
              />
              <InputGroupAddon align='inline-end' className='pr-1.5'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setIsVisible(prevState => !prevState)}
                  className='text-muted-foreground focus-visible:ring-ring/50 rounded-l-none hover:bg-transparent'
                >
                  {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                  <span className='sr-only'>{isVisible ? t('common.hidePassword') : t('common.showPassword')}</span>
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className='w-full space-y-2'>
            <Label htmlFor='new-password' className='gap-1'>
              {t('settings.emailPassword.newPassword')}
              <span className='text-destructive'>*</span>
            </Label>
            <InputGroup className='mb-3'>
              <InputGroupInput
                id='new-password'
                type={isVisible ? 'text' : 'password'}
                placeholder={t('settings.emailPassword.passwordPlaceholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <InputGroupAddon align='inline-end' className='pr-1.5'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={toggleVisibility}
                  className='text-muted-foreground focus-visible:ring-ring/50 rounded-l-none hover:bg-transparent'
                >
                  {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                  <span className='sr-only'>{isVisible ? t('common.hidePassword') : t('common.showPassword')}</span>
                </Button>
              </InputGroupAddon>
            </InputGroup>

            <div className='mb-4 flex h-1 w-full gap-1'>
              {Array.from({ length: 5 }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    'h-full flex-1 rounded-full transition-all duration-500 ease-out',
                    index < strengthScore ? getColor(strengthScore) : 'bg-border'
                  )}
                />
              ))}
            </div>

            <p className='text-foreground text-sm font-medium'>
              {t('settings.emailPassword.mustContain', { strength: getText(strengthScore) })}
            </p>

            <ul className='mb-4 space-y-1.5'>
              {strength.map((req, index) => (
                <li key={index} className='flex items-center gap-2'>
                  {req.met ? (
                    <CheckIcon className='size-4 text-green-600 dark:text-green-400' />
                  ) : (
                    <XIcon className='text-muted-foreground size-4' />
                  )}
                  <span
                    className={cn('text-xs', req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}
                  >
                    {t(req.textKey)}
                    <span className='sr-only'>
                      {req.met
                        ? t('settings.emailPassword.requirementMet')
                        : t('settings.emailPassword.requirementNotMet')}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className='mt-6 flex justify-end'>
            <Button type='submit' className='max-sm:w-full'>
              {t('common.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EmailPass
