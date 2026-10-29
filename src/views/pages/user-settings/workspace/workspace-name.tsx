'use client'

// React Imports
import { useId, useMemo, useState } from 'react'

// Third-party Imports
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/lib/utils'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const WorkspaceName = () => {
  const { t } = useTranslation()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<string>('Indian/Cocos')

  // Fetch supported timezones
  const timezones = Intl.supportedValuesOf('timeZone')

  const formattedTimezones = useMemo(() => {
    return timezones
      .map(timezone => {
        const formatter = new Intl.DateTimeFormat('en', {
          timeZone: timezone,
          timeZoneName: 'shortOffset'
        })

        const parts = formatter.formatToParts(new Date())

        const offset = parts.find(part => part.type === 'timeZoneName')?.value || ''

        const formattedOffset = offset === 'GMT' ? 'GMT+0' : offset

        return {
          value: timezone,
          label: `(${formattedOffset}) ${timezone.replace(/_/g, ' ')}`,
          numericOffset: parseInt(formattedOffset.replace('GMT', '').replace('+', '') || '0')
        }
      })
      .sort((a, b) => a.numericOffset - b.numericOffset) // Sort by numeric offset
  }, [timezones])

  return (
    <div>
      <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
        {/* Workspace Name */}
        <div className='flex flex-col space-y-1'>
          <h3 className='text-base font-semibold'>{t('settings.workspaceName.title')}</h3>
          <p className='text-muted-foreground text-sm'>{t('settings.workspaceName.description')}</p>
        </div>
        {/* Content */}
        <div className='space-y-6 lg:col-span-2'>
          {/* Workspace Name */}
          <div className='flex flex-col items-start gap-1'>
            <Label htmlFor='workspace-name'>{t('settings.workspaceName.nameLabel')}</Label>
            <Input id='workspace-name' placeholder='WordZen' defaultValue='WordZen' />
          </div>
          {/* Workspace ID */}
          <div className='w-full space-y-2'>
            <Label htmlFor='app-id'>{t('settings.workspaceName.appId')}</Label>
            <Input
              id='app-id'
              type='text'
              placeholder={t('settings.workspaceName.appId')}
              defaultValue='0b1c2d3e'
              className='read-only:bg-muted'
              readOnly
            />
          </div>
          {/* Workspace timezone */}
          <div className='w-full space-y-2'>
            <Label htmlFor={id}>{t('settings.workspaceName.timezone')}</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger
                render={
                  <Button
                    id={id}
                    variant='outline'
                    role='combobox'
                    aria-expanded={open}
                    className='w-full justify-between'
                  />
                }
              >
                <span className={cn('truncate')}>
                  {value ? (
                    formattedTimezones.find(timezone => timezone.value === value)?.label
                  ) : (
                    <span className='text-muted-foreground'>{t('settings.workspaceName.selectTimezone')}</span>
                  )}
                </span>
                <ChevronsUpDownIcon className='text-muted-foreground/80 shrink-0' aria-hidden='true' />
              </PopoverTrigger>
              <PopoverContent className='w-(--anchor-width) p-0'>
                <Command>
                  <CommandInput placeholder={t('settings.workspaceName.searchTimezone')} />
                  <CommandList>
                    <CommandEmpty>{t('settings.workspaceName.noTimezone')}</CommandEmpty>
                    <CommandGroup>
                      {formattedTimezones.map(({ value: itemValue, label }) => (
                        <CommandItem
                          key={itemValue}
                          value={itemValue}
                          onSelect={currentValue => {
                            setValue(currentValue === value ? '' : currentValue)
                            setOpen(false)
                          }}
                        >
                          <span className='flex-1 truncate'>{label}</span>
                          {value === itemValue && <CheckIcon className='ml-auto' />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className='flex justify-end'>
            <Button type='submit' className='max-sm:w-full'>
              {t('common.saveChanges')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkspaceName
