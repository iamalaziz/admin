'use client'

import { useState } from 'react'

import Link from 'next/link'

import { ArrowLeftIcon, BanIcon, CircleCheckIcon, CreditCardIcon, TrophyIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { useUserAchievements } from '@/hooks/wordzen/use-achievement-list'
import { useUserDetail } from '@/hooks/wordzen/use-user-list'
import { useTranslation } from '@/lib/i18n'
import type { RoleCode, SubscriptionPayload } from '@/types/wordzen/user-types'

import { DetailRow, Timestamp, UserRoleBadge, UserStatusBadge } from '../shared/primitives'
import { BlockUserDialog } from './block-user-dialog'
import { UserAchievementsSheet } from './user-achievements-sheet'
import { UserPaymentsCard } from './user-payments-card'
import { UserSubscriptionSheet } from './user-subscription-sheet'

export function UserDetail({ uid }: { uid: string }) {
  const { t } = useTranslation()
  const { user, status, blockUser, unblockUser, setRoles, setSubscription } = useUserDetail(uid)
  const achievements = useUserAchievements(uid)
  const [blocking, setBlocking] = useState(false)
  const [managingAchievements, setManagingAchievements] = useState(false)
  const [changingSubscription, setChangingSubscription] = useState(false)

  if (!user || !status) {
    return (
      <Card className='shadow-none'>
        <CardContent className='flex flex-col items-start gap-3 py-10'>
          <p className='font-medium'>{t('manage.userDetail.notFound')}</p>
          <p className='text-muted-foreground text-sm break-all'>{t('manage.userDetail.notFoundHint', { uid })}</p>
          <Button render={<Link href='/manage/users' />} nativeButton={false} variant='outline'>
            <ArrowLeftIcon className='size-4' />
            {t('manage.userDetail.backToUsers')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { received, total } = achievements.totals
  const receivedPercent = total === 0 ? 0 : Math.round((received / total) * 100)

  // `receivedAt` is an ISO timestamp, so sorting the strings sorts them chronologically.
  const latest = achievements.achievements
    .filter(achievement => achievement.received)
    .sort((a, b) => (a.receivedAt ?? '').localeCompare(b.receivedAt ?? ''))
    .at(-1)

  const handleGrant = (code: string) => {
    const granted = achievements.grantAchievement(code)

    if (granted) {
      toast.success(t('manage.userAchievements.toast.granted', { title: granted.title, name: user.username }))
    }
  }

  const handleRevoke = (code: string) => {
    const revoked = achievements.achievements.find(achievement => achievement.code === code)

    if (achievements.revokeAchievement(code)) {
      toast.success(t('manage.userAchievements.toast.revoked', { title: revoked?.title ?? code, name: user.username }))
    }
  }

  const changeSubscription = (payload: SubscriptionPayload) => {
    setSubscription(payload)
    toast.success(
      payload.code
        ? t('manage.userDetail.toast.subscriptionChanged', { plan: payload.code, name: user.username })
        : t('manage.userDetail.toast.subscriptionCleared', { name: user.username })
    )
  }

  const toggleRole = (role: RoleCode, granted: boolean) => {
    const next = granted ? [...user.roles, role] : user.roles.filter(current => current !== role)

    setRoles(next)
    toast.success(
      t(granted ? 'manage.userDetail.toast.roleGranted' : 'manage.userDetail.toast.roleRevoked', {
        role: t(`manage.roles.${role}`),
        name: user.username
      })
    )
  }

  return (
    <div className='flex flex-col gap-3 lg:gap-6'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-col gap-1'>
          <Button
            render={<Link href='/manage/users' />}
            nativeButton={false}
            variant='ghost'
            size='sm'
            className='-ml-2 w-fit'
          >
            <ArrowLeftIcon className='size-4' />
            {t('manage.userDetail.allUsers')}
          </Button>
          <h1 className='truncate text-2xl font-semibold'>{user.username}</h1>
          <div className='flex flex-wrap items-center gap-2'>
            <UserStatusBadge status={user.status} />
            <UserRoleBadge roles={user.roles} />
          </div>
        </div>

        {user.status === 'BLOCKED' ? (
          <Button
            onClick={() => {
              unblockUser()
              toast.success(t('manage.users.toast.unblocked', { name: user.username }))
            }}
          >
            <CircleCheckIcon className='size-4' />
            {t('manage.userDetail.unblockUser')}
          </Button>
        ) : (
          <Button variant='destructive' onClick={() => setBlocking(true)}>
            <BanIcon className='size-4' />
            {t('manage.userDetail.blockUser')}
          </Button>
        )}
      </div>

      {user.status === 'BLOCKED' ? (
        <Alert variant='destructive'>
          <BanIcon />
          <AlertTitle>{t('manage.userDetail.blockedAlert.title')}</AlertTitle>
          <AlertDescription>
            {user.blockedReason ?? t('manage.userDetail.blockedAlert.noReason')}
            {user.blockedAt ? (
              <>
                {' '}
                {t('manage.userDetail.blockedAlert.on')} <Timestamp value={user.blockedAt} withTime />
                {user.blockedBy ? ` — ${t('manage.userDetail.blockedAlert.by', { name: user.blockedBy })}` : null}.
              </>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className='grid gap-3 lg:grid-cols-2 lg:gap-6'>
        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.userDetail.account.title')}</CardTitle>
            <CardDescription>{t('manage.userDetail.account.description')}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col divide-y'>
            <DetailRow label={t('manage.userDetail.fields.id')}>{user.id}</DetailRow>
            <DetailRow label={t('manage.userDetail.fields.uid')}>
              <code className='text-xs break-all'>{user.uid}</code>
            </DetailRow>
            <DetailRow label={t('manage.userDetail.fields.email')}>{user.email}</DetailRow>
            <DetailRow label={t('manage.userDetail.fields.created')}>
              <Timestamp value={user.createdAt} withTime />
            </DetailRow>
            <DetailRow label={t('manage.userDetail.fields.updated')}>
              <Timestamp value={user.updatedAt} withTime />
            </DetailRow>
            <DetailRow label={t('manage.userDetail.fields.lastReset')}>
              <Timestamp value={user.lastReset} withTime />
            </DetailRow>
          </CardContent>
        </Card>

        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.userDetail.status.title')}</CardTitle>
            <CardDescription>{t('manage.userDetail.status.description')}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col divide-y'>
            <DetailRow label={t('manage.userDetail.fields.status')}>
              <UserStatusBadge status={status.status} />
            </DetailRow>
            <DetailRow label={t('manage.userDetail.fields.authVersion')}>{status.authVersion}</DetailRow>
            <DetailRow label={t('manage.userDetail.fields.blockedAt')}>
              <Timestamp value={status.blockedAt} withTime />
            </DetailRow>
            <DetailRow label={t('manage.userDetail.fields.blockedReason')}>{status.blockedReason ?? '-'}</DetailRow>
            <DetailRow label={t('manage.userDetail.fields.blockedBy')}>
              {status.blockedBy ? <code className='text-xs break-all'>{status.blockedBy}</code> : '-'}
            </DetailRow>
          </CardContent>
        </Card>

        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.userDetail.subscription.title')}</CardTitle>
            <CardDescription>{t('manage.userDetail.subscription.description')}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            <div className='flex flex-col divide-y'>
              {user.subscription ? (
                <>
                  <DetailRow label={t('manage.userDetail.fields.plan')}>
                    <Badge variant='secondary'>{user.subscription.code}</Badge>
                  </DetailRow>
                  <DetailRow label={t('manage.userDetail.fields.ends')}>
                    <Timestamp value={user.subscription.endSubscriptionDate} withTime />
                  </DetailRow>
                  <DetailRow label={t('manage.userDetail.fields.updated')}>
                    <Timestamp value={user.subscription.updatedAt} withTime />
                  </DetailRow>
                </>
              ) : (
                <p className='text-muted-foreground py-2 text-sm'>{t('manage.userDetail.subscription.none')}</p>
              )}
            </div>
            <Button variant='outline' className='w-fit' onClick={() => setChangingSubscription(true)}>
              <CreditCardIcon className='size-4' />
              {t('manage.userDetail.subscription.change')}
            </Button>
          </CardContent>
        </Card>

        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.userDetail.roles.title')}</CardTitle>
            <CardDescription>{t('manage.userDetail.roles.description')}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-3'>
            {(['ROLE_AUTHOR', 'ROLE_ADMIN'] as const).map(role => (
              <div key={role} className='flex items-center justify-between gap-3'>
                <div className='flex flex-col gap-0.5'>
                  <span className='text-sm font-medium'>{t(`manage.roles.${role}`)}</span>
                  <span className='text-muted-foreground text-xs'>{role}</span>
                </div>
                <Switch
                  checked={user.roles.includes(role)}
                  onCheckedChange={granted => toggleRole(role, granted)}
                  aria-label={t('manage.userDetail.roles.toggle', { role: t(`manage.roles.${role}`) })}
                />
              </div>
            ))}
            <p className='text-muted-foreground text-xs'>{t('manage.userDetail.roles.implicit')}</p>
          </CardContent>
        </Card>

        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.userDetail.achievements.title')}</CardTitle>
            <CardDescription>{t('manage.userDetail.achievements.description')}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            <div className='flex items-baseline justify-between gap-2'>
              <span className='text-2xl font-semibold'>
                {received}
                <span className='text-muted-foreground text-base font-normal'> / {total}</span>
              </span>
              <span className='text-muted-foreground text-sm'>{receivedPercent}%</span>
            </div>
            <Progress value={receivedPercent} />
            <div className='flex flex-col divide-y'>
              <DetailRow label={t('manage.userDetail.achievements.latest')}>
                {latest ? (
                  <>
                    {latest.title} · <Timestamp value={latest.receivedAt} />
                  </>
                ) : (
                  t('manage.badges.none')
                )}
              </DetailRow>
            </div>
            <Button variant='outline' className='w-fit' onClick={() => setManagingAchievements(true)}>
              <TrophyIcon className='size-4' />
              {t('manage.userDetail.achievements.manage')}
            </Button>
          </CardContent>
        </Card>

        <UserPaymentsCard uid={uid} />
      </div>

      <UserSubscriptionSheet
        user={changingSubscription ? user : null}
        onOpenChange={open => !open && setChangingSubscription(false)}
        onSubmit={changeSubscription}
      />

      <UserAchievementsSheet
        user={managingAchievements ? user : null}
        groups={achievements.groups}
        onOpenChange={open => !open && setManagingAchievements(false)}
        onGrant={handleGrant}
        onRevoke={handleRevoke}
      />

      <BlockUserDialog
        user={blocking ? user : null}
        onOpenChange={open => !open && setBlocking(false)}
        onConfirm={reason => {
          blockUser(reason)
          toast.success(t('manage.users.toast.blocked', { name: user.username }))
        }}
      />
    </div>
  )
}
