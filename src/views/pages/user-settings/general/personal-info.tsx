'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// Third-party Imports
import { ImageIcon, Trash2Icon, UploadCloudIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Hook Imports
import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const countries: { value: string; labelKey: TranslationKey; flag: string }[] = [
  {
    value: 'india',
    labelKey: 'settings.personal.countries.india',
    flag: '/images/flags/india.webp'
  },
  {
    value: 'china',
    labelKey: 'settings.personal.countries.china',
    flag: '/images/flags/china.webp'
  },
  {
    value: 'monaco',
    labelKey: 'settings.personal.countries.monaco',
    flag: '/images/flags/monaco.webp'
  },
  {
    value: 'serbia',
    labelKey: 'settings.personal.countries.serbia',
    flag: '/images/flags/serbia.webp'
  },
  {
    value: 'romania',
    labelKey: 'settings.personal.countries.romania',
    flag: '/images/flags/romania.webp'
  },
  {
    value: 'mayotte',
    labelKey: 'settings.personal.countries.mayotte',
    flag: '/images/flags/mayotte.webp'
  },
  {
    value: 'iraq',
    labelKey: 'settings.personal.countries.iraq',
    flag: '/images/flags/iraq.webp'
  },
  {
    value: 'syria',
    labelKey: 'settings.personal.countries.syria',
    flag: '/images/flags/syria.webp'
  },
  {
    value: 'korea',
    labelKey: 'settings.personal.countries.korea',
    flag: '/images/flags/korea.webp'
  },
  {
    value: 'zimbabwe',
    labelKey: 'settings.personal.countries.zimbabwe',
    flag: '/images/flags/zimbabwe.webp'
  }
]

const PersonalInfo = () => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // The Select needs plain {label, value} pairs, so resolve the keys here.
  const countryItems = countries.map(country => ({ label: t(country.labelKey), value: country.value }))

  useEffect(() => {
    if (!file) {
      const t = window.setTimeout(() => setPreview(null), 0)

      return () => clearTimeout(t)
    }

    const url = URL.createObjectURL(file)

    const t = window.setTimeout(() => setPreview(url), 0)

    return () => {
      clearTimeout(t)
      URL.revokeObjectURL(url)
    }
  }, [file])

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]

    if (!f) return

    if (!f.type.startsWith('image/')) {
      window.alert(t('settings.upload.notAnImage'))
      e.currentTarget.value = ''

      return
    }

    if (f.size > 1024 * 1024) {
      window.alert(t('settings.upload.tooLarge'))
      e.currentTarget.value = ''

      return
    }

    setFile(f)
  }

  const openPicker = () => inputRef.current?.click()

  const remove = () => {
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>{t('settings.personal.title')}</h3>
        <p className='text-muted-foreground text-sm'>{t('settings.personal.description')}</p>
      </div>

      {/* Content */}
      <div className='space-y-6 lg:col-span-2'>
        <form className='mx-auto'>
          <div className='mb-6 w-full space-y-2'>
            <Label>{t('settings.personal.avatar')}</Label>
            <div className='flex items-center gap-4'>
              <div
                role='button'
                tabIndex={0}
                aria-label={t('settings.personal.uploadAvatarAria')}
                onClick={openPicker}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openPicker()
                  }
                }}
                className='flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed hover:opacity-95'
              >
                {preview ? (
                  <img
                    src={preview}
                    alt={t('settings.personal.avatarPreviewAlt')}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <ImageIcon />
                )}
              </div>

              <div className='flex items-center gap-2'>
                <input ref={inputRef} type='file' accept='image/*' className='hidden' onChange={onSelect} />
                <Button type='button' variant='outline' onClick={openPicker} className='flex items-center gap-2'>
                  <UploadCloudIcon />
                  {t('settings.personal.uploadAvatar')}
                </Button>
                <Button type='button' variant='ghost' onClick={remove} disabled={!file} className='text-destructive!'>
                  <Trash2Icon />
                </Button>
              </div>
            </div>
            <p className='text-muted-foreground text-sm'>{t('settings.upload.sizeHint')}</p>
          </div>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <div className='flex flex-col items-start gap-2'>
              <Label htmlFor='multi-step-personal-info-first-name'>{t('forms.fields.firstName')}</Label>
              <Input id='multi-step-personal-info-first-name' placeholder={t('forms.placeholders.firstName')} />
            </div>
            <div className='flex flex-col items-start gap-2'>
              <Label htmlFor='multi-step-personal-info-last-name'>{t('forms.fields.lastName')}</Label>
              <Input id='multi-step-personal-info-last-name' placeholder={t('forms.placeholders.lastName')} />
            </div>
            <div className='flex flex-col items-start gap-2'>
              <Label htmlFor='multi-step-personal-info-mobile'>{t('forms.fields.mobile')}</Label>
              <Input id='multi-step-personal-info-mobile' type='tel' placeholder={t('forms.placeholders.mobile')} />
            </div>
            <div className='flex flex-col items-start gap-2'>
              <Label htmlFor='country'>{t('settings.personal.country')}</Label>
              <Select defaultValue='1' required items={countryItems}>
                <SelectTrigger id='country' className='w-full'>
                  <SelectValue placeholder={t('settings.personal.selectCountry')}>
                    {(value: string) => {
                      const country = countries.find(c => c.value === value)

                      return country ? (
                        <span className='flex items-center gap-2'>
                          <img
                            src={country.flag}
                            alt={t('settings.personal.countryFlagAlt', { country: t(country.labelKey) })}
                            className='h-4 w-5 shrink-0'
                          />
                          <span className='truncate'>{t(country.labelKey)}</span>
                        </span>
                      ) : (
                        <span>{t('settings.personal.selectCountry')}</span>
                      )
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className='max-h-100'>
                  <SelectGroup>
                    {countries.map(country => (
                      <SelectItem key={country.value} value={country.value}>
                        <img
                          src={country.flag}
                          alt={t('settings.personal.countryFlagAlt', { country: t(country.labelKey) })}
                          className='h-4 w-5'
                        />{' '}
                        <span className='truncate'>{t(country.labelKey)}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='gender'>{t('settings.personal.gender')}</Label>
              <Select>
                <SelectTrigger id='gender' className='w-full'>
                  <SelectValue placeholder={t('settings.personal.selectGender')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value='male'>{t('settings.personal.genderOptions.male')}</SelectItem>
                    <SelectItem value='female'>{t('settings.personal.genderOptions.female')}</SelectItem>
                    <SelectItem value='other'>{t('settings.personal.genderOptions.other')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='role'>{t('settings.personal.role')}</Label>
              <Select>
                <SelectTrigger id='role' className='w-full'>
                  <SelectValue placeholder={t('settings.personal.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value='admin'>{t('settings.personal.roleOptions.admin')}</SelectItem>
                    <SelectItem value='user'>{t('settings.personal.roleOptions.user')}</SelectItem>
                    <SelectItem value='other'>{t('settings.personal.roleOptions.other')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
        <div className='flex justify-end'>
          <Button type='submit' className='max-sm:w-full'>
            {t('common.saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfo
