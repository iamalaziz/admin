'use client'

// Next Imports
import Link from 'next/link'

// Components Import
import Logo from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import LoginForm from '@/views/pages/auth/login/login-form'

// SVG Import
import AuthBackgroundShape from '@/assets/svg/auth-background-shape'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const Login = () => {
  const { t } = useTranslation()

  return (
    <div className='relative flex h-auto min-h-screen items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8'>
      <div className='absolute'>
        <AuthBackgroundShape />
      </div>

      <Card className='z-1 w-full gap-6 py-6 sm:max-w-lg'>
        <CardHeader className='gap-6 px-6'>
          <Link href='/'>
            <Logo className='gap-3' />
          </Link>

          <div>
            <CardTitle className='mb-2 text-2xl font-semibold'>{t('auth.login.title')}</CardTitle>
            <CardDescription className='text-base'>{t('auth.tagline')}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className='px-6'>
          <p className='text-muted-foreground mb-6 text-base'>
            {t('auth.login.magicLinkPrefix')}{' '}
            <Link href='#' className='text-card-foreground hover:underline'>
              {t('auth.login.magicLink')}
            </Link>
          </p>

          {/* Quick Login Buttons */}
          <div className='mb-6 flex flex-wrap gap-4 sm:gap-6'>
            <Button variant='outline' className='grow'>
              {t('auth.login.loginAsUser')}
            </Button>
            <Button variant='outline' className='grow'>
              {t('auth.login.loginAsAdmin')}
            </Button>
          </div>

          {/* Login Form */}
          <div className='space-y-4'>
            <LoginForm />

            <p className='text-muted-foreground text-center text-base'>
              {t('auth.login.newHerePrefix')}{' '}
              <Link href='/pages/auth/register' className='text-card-foreground hover:underline'>
                {t('auth.login.createAccount')}
              </Link>
            </p>

            <div className='flex items-center gap-4'>
              <Separator className='flex-1' />
              <p className='text-base'>{t('common.or')}</p>
              <Separator className='flex-1' />
            </div>

            <Button variant='ghost' className='w-full' render={<Link href='#' />} nativeButton={false}>
              {t('auth.signInWithGoogle')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
