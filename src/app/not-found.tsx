'use client'

// React Imports
import Link from 'next/link'

// Component Imports
import { Button } from '@/components/ui/button'

// SVG Imports
import Icon404 from '@/assets/svg/404'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const NotFound = () => {
  const { t } = useTranslation()

  return (
    <div className='flex h-screen w-screen flex-col items-center justify-center gap-9 p-6'>
      <Icon404 className='h-auto w-full sm:h-120 sm:w-146' />
      <div className='flex flex-col items-center gap-4 text-center'>
        <p className='text-muted-foreground text-xl sm:text-2xl'>{t('misc.notFoundMessage')}</p>
        <Button className='rounded-full' render={<Link href='/' />} nativeButton={false}>
          {t('misc.goBackHome')}
        </Button>
      </div>
    </div>
  )
}

export default NotFound
