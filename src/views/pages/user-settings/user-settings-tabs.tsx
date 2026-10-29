'use client'

// React Imports
import { useEffect } from 'react'

// Third-party Imports
import { parseAsString, useQueryState } from 'nuqs'

// Component Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UserGeneral from '@/views/pages/user-settings/general'
import Workspace from '@/views/pages/user-settings/workspace'

// Hook Imports
import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const tabs: { nameKey: TranslationKey; value: string; content: React.ReactNode }[] = [
  {
    nameKey: 'settings.tabs.general',
    value: 'general',
    content: <UserGeneral />
  },
  {
    nameKey: 'settings.tabs.workspace',
    value: 'workspace',
    content: <Workspace />
  }
]

const UserSettingsTabs = () => {
  const { t } = useTranslation()

  const [activeSetting, setActiveSetting] = useQueryState(
    'setting',
    parseAsString.withDefault('general').withOptions({
      history: 'push',
      shallow: true,
      clearOnDefault: false
    })
  )

  useEffect(() => {
    setActiveSetting(activeSetting)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='w-full'>
      <Tabs
        value={activeSetting}
        onValueChange={value => {
          setActiveSetting(value)
        }}
      >
        <div className='overflow-x-auto sm:overflow-visible'>
          <TabsList
            variant='line'
            className='h-fit! w-max min-w-full flex-nowrap justify-start gap-0 rounded-none border-b p-0 sm:w-full sm:flex-wrap'
          >
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className='not-data-active:hover:group-data-horizontal/tabs:after:bg-muted-foreground/30 shrink-0 border-0 group-data-horizontal/tabs:after:bottom-[-0.5px] not-data-active:hover:group-data-horizontal/tabs:after:opacity-100 sm:flex-0'
              >
                {t(tab.nameKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default UserSettingsTabs
