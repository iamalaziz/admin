'use client'

// React Imports
import { useState } from 'react'

// Type Imports
import type { AppUser } from '@/types/apps/user-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

export interface SecurityTabProps {
  user: AppUser
}

export function SecurityTab({ user }: SecurityTabProps) {
  const { t } = useTranslation()
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(user.twoFactorEnabled ?? false)
  const recentDevices = user.recentDevices ?? []

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>{t('users.security.changePassword')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='current-password'>{t('users.security.currentPassword')}</Label>
              <Input id='current-password' type='password' placeholder='············' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='new-password'>{t('users.security.newPassword')}</Label>
              <Input id='new-password' type='password' placeholder='············' />
            </div>
          </div>
          <div className='space-y-2 md:max-w-md'>
            <Label htmlFor='confirm-password'>{t('users.security.confirmNewPassword')}</Label>
            <Input id='confirm-password' type='password' placeholder='············' />
          </div>
          <ul className='text-muted-foreground list-inside list-disc space-y-1 text-sm'>
            <li>{t('users.security.hintLength')}</li>
            <li>{t('users.security.hintCase')}</li>
            <li>{t('users.security.hintSymbol')}</li>
          </ul>
          <Button>{t('common.saveChanges')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between gap-4'>
          <div>
            <CardTitle className='text-base'>{t('users.security.twoStepsTitle')}</CardTitle>
            <p className='text-muted-foreground mt-1 text-sm'>{t('users.security.twoStepsDescription')}</p>
          </div>
          <Switch
            checked={isTwoFactorEnabled}
            onCheckedChange={setIsTwoFactorEnabled}
            aria-label={t('users.security.twoStepsAria')}
          />
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>
            {isTwoFactorEnabled ? t('users.security.twoFactorEnabled') : t('users.security.twoFactorDisabled')}
          </p>
        </CardContent>
      </Card>

      <Card className='gap-0 py-0'>
        <CardHeader className='border-b px-6 py-4'>
          <CardTitle className='text-base'>{t('users.security.recentDevices')}</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className='text-muted-foreground pl-6'>{t('users.security.browser')}</TableHead>
              <TableHead className='text-muted-foreground'>{t('users.security.device')}</TableHead>
              <TableHead className='text-muted-foreground'>{t('users.security.location')}</TableHead>
              <TableHead className='text-muted-foreground pr-6 text-right'>
                {t('users.security.recentActivity')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentDevices.length === 0 ? (
              <TableRow className='hover:bg-transparent'>
                <TableCell colSpan={4} className='text-muted-foreground py-8 text-center text-sm'>
                  {t('users.security.noRecentDevices')}
                </TableCell>
              </TableRow>
            ) : (
              recentDevices.map(device => (
                <TableRow key={device.id}>
                  <TableCell className='pl-6 font-medium'>{device.browser}</TableCell>
                  <TableCell className='text-muted-foreground'>{device.device}</TableCell>
                  <TableCell className='text-muted-foreground'>{device.location}</TableCell>
                  <TableCell className='pr-6 text-right'>
                    {device.isCurrentDevice ? (
                      <span className='text-primary text-sm font-medium'>{device.lastActive}</span>
                    ) : (
                      <span className='text-muted-foreground text-sm'>{device.lastActive}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
