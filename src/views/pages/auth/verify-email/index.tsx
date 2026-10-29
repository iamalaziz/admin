'use client'

// Next Imports
import Link from 'next/link'

// Component Import
import Logo from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// SVG Import
import AuthBackgroundShape from '@/assets/svg/auth-background-shape'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const VerifyEmail = () => {
  const { t } = useTranslation()

  return (
    <div className='relative flex h-auto min-h-screen items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8'>
      <div className='absolute'>
        <AuthBackgroundShape />
      </div>

      <Card className='z-1 w-full gap-6 py-6 sm:max-w-md'>
        <CardHeader className='gap-6 px-6'>
          <Link href='/'>
            <Logo className='justify-center gap-3' />
          </Link>

          <div className='text-center'>
            <CardTitle className='mb-2 text-2xl font-semibold'>{t('auth.verifyEmail.title')}</CardTitle>
            <CardDescription className='text-base'>
              {t('auth.verifyEmail.description', { email: 'hello@example.com' })}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className='px-6'>
          <div className='space-y-4'>
            <Button className='w-full' render={<Link href='#' />} nativeButton={false}>
              {t('auth.verifyEmail.skipForNow')}
            </Button>

            <p className='text-muted-foreground text-center text-base'>
              {t('auth.verifyEmail.noMailPrefix')}{' '}
              <Link href='#' className='text-card-foreground hover:underline'>
                {t('auth.verifyEmail.resend')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VerifyEmail
