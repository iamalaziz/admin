'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// Third-party Imports
import { ImageIcon, TrashIcon, UploadCloudIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const WorkspaceDetail = () => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

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
    <div>
      <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
        {/* Workspace Detail */}
        <div className='flex flex-col space-y-1'>
          <h3 className='text-base font-semibold'>{t('settings.workspaceDetail.title')}</h3>
          <p className='text-muted-foreground text-sm'>{t('settings.workspaceDetail.description')}</p>
        </div>
        {/* Content */}
        <div className='space-y-6 lg:col-span-2'>
          {/* Workspace logo */}
          <div className='w-full space-y-2'>
            <Label>{t('settings.workspaceDetail.logo')}</Label>
            <div className='flex items-center gap-4'>
              <div
                role='button'
                tabIndex={0}
                aria-label={t('settings.workspaceDetail.uploadLogoAria')}
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
                    alt={t('settings.workspaceDetail.logoPreviewAlt')}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <ImageIcon />
                )}
              </div>

              <div className='flex items-center gap-2'>
                <input ref={inputRef} type='file' accept='image/*' className='hidden' onChange={onSelect} />
                <Button variant='outline' onClick={openPicker} className='flex items-center gap-2'>
                  <UploadCloudIcon />
                  {t('settings.workspaceDetail.uploadLogo')}
                </Button>
                <Button variant='ghost' onClick={remove} disabled={!file} className='text-destructive'>
                  <TrashIcon />
                </Button>
              </div>
            </div>
            <p className='text-muted-foreground text-sm'>{t('settings.upload.sizeHint')}</p>
          </div>
          {/* Workspace URl */}
          <div className='w-full space-y-2'>
            <Label htmlFor='workspace-url'>{t('settings.workspaceDetail.url')}</Label>
            <InputGroup>
              <InputGroupAddon className='text-foreground font-normal'>https://example.com/</InputGroupAddon>
              <InputGroupInput id='workspace-url' placeholder='wordzen' />
              <InputGroupAddon align='inline-end' className='text-foreground font-normal'>
                .com
              </InputGroupAddon>
            </InputGroup>
          </div>
          {/* Workspace slug */}
          <div className='w-full space-y-2'>
            <Label htmlFor='workspace-slug'>{t('settings.workspaceDetail.slug')}</Label>
            <Input id='workspace-slug' type='text' placeholder='wordzen-admin' />
            <p className='text-muted-foreground text-xs'>{t('settings.workspaceDetail.slugHint')}</p>
          </div>
          {/* Workspace Description */}
          <div className='w-full space-y-2'>
            <Label htmlFor='workspace-description'>{t('settings.workspaceDetail.descriptionLabel')}</Label>
            <Textarea placeholder={t('settings.workspaceDetail.descriptionPlaceholder')} id='workspace-description' />
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

export default WorkspaceDetail
