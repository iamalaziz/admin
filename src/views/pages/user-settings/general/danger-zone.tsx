'use client'

// Third-party Imports
import { Trash2Icon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const DangerZone = () => {
  const { t } = useTranslation()

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>{t('settings.dangerZone.title')}</h3>
        <p className='text-muted-foreground text-sm'>
          {t('settings.dangerZone.description')}{' '}
          <a href='#' className='text-card-foreground font-medium hover:underline'>
            {t('settings.dangerZone.learnMore')}
          </a>
        </p>
      </div>

      {/* Content */}
      <div className='space-y-6 lg:col-span-2'>
        <Card>
          <CardContent>
            <div className='flex justify-between gap-4 max-lg:flex-col lg:items-center'>
              <div className='space-y-1'>
                <h3 className='text-sm font-medium'>{t('settings.dangerZone.deleteAccount')}</h3>
                <p className='text-muted-foreground text-sm'>{t('settings.dangerZone.deleteAccountDescription')}</p>
              </div>
              <Dialog>
                <DialogTrigger
                  render={
                    <Button
                      variant='outline'
                      className='border-destructive! text-destructive! hover:bg-destructive/10! focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 max-lg:w-full'
                    />
                  }
                >
                  <Trash2Icon />
                  {t('common.delete')}
                </DialogTrigger>
                <DialogContent className='sm:max-w-md'>
                  <DialogHeader className='space-y-2'>
                    <DialogTitle>{t('settings.dangerZone.deleteAccount')}</DialogTitle>
                    <div className='text-muted-foreground text-sm'>
                      {t('settings.dangerZone.deleteAccountDescription')}
                    </div>
                  </DialogHeader>
                  <div className='flex flex-col-reverse gap-4 sm:flex-row sm:justify-end'>
                    <DialogClose render={<Button variant='outline' />}>{t('common.cancel')}</DialogClose>
                    <DialogClose render={<Button variant='destructive' />}>{t('common.delete')}</DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DangerZone
