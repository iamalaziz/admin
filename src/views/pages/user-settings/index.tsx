'use client'

import { Suspense } from 'react'

import UserSettingsTabs from '@/views/pages/user-settings/user-settings-tabs'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const UserSettings = () => {
  const { t } = useTranslation()

  return (
    <div>
      <div className='mb-4 md:mb-6 lg:mb-10'>
        <h1 className='text-xl font-bold'>{t('settings.title')}</h1>
        <p className='text-muted-foreground'>{t('settings.description')}</p>
      </div>
      <Suspense>
        <UserSettingsTabs />
      </Suspense>
    </div>
  )
}

export default UserSettings
