'use client'

import { useState } from 'react'

import Link from 'next/link'

import { ArrowLeftIcon, BanIcon, CircleCheckIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useUserDetail } from '@/hooks/wordzen/use-user-list'
import type { RoleCode } from '@/types/wordzen/user-types'
import { ROLE_LABELS } from '@/types/wordzen/user-types'

import { DetailRow, Timestamp, UserStatusBadge } from '../shared/primitives'
import { BlockUserDialog } from './block-user-dialog'

export function UserDetail({ uid }: { uid: string }) {
  const { user, status, blockUser, unblockUser, setRoles } = useUserDetail(uid)
  const [blocking, setBlocking] = useState(false)

  if (!user || !status) {
    return (
      <Card className='shadow-none'>
        <CardContent className='flex flex-col items-start gap-3 py-10'>
          <p className='font-medium'>User not found.</p>
          <p className='text-muted-foreground text-sm break-all'>No account with uid {uid}.</p>
          <Button render={<Link href='/manage/users' />} nativeButton={false} variant='outline'>
            <ArrowLeftIcon className='size-4' />
            Back to users
          </Button>
        </CardContent>
      </Card>
    )
  }

  const toggleRole = (role: RoleCode, granted: boolean) => {
    const next = granted ? [...user.roles, role] : user.roles.filter(current => current !== role)

    setRoles(next)
    toast.success(`${ROLE_LABELS[role]} ${granted ? 'granted to' : 'revoked from'} ${user.username}`)
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
            All users
          </Button>
          <h1 className='truncate text-2xl font-semibold'>{user.username}</h1>
          <div className='flex flex-wrap items-center gap-2'>
            <UserStatusBadge status={user.status} />
            {user.roles.map(role => (
              <Badge key={role} variant={role === 'ROLE_USER' ? 'outline' : 'secondary'}>
                {ROLE_LABELS[role]}
              </Badge>
            ))}
          </div>
        </div>

        {user.status === 'BLOCKED' ? (
          <Button
            onClick={() => {
              unblockUser()
              toast.success(`${user.username} unblocked`)
            }}
          >
            <CircleCheckIcon className='size-4' />
            Unblock user
          </Button>
        ) : (
          <Button variant='destructive' onClick={() => setBlocking(true)}>
            <BanIcon className='size-4' />
            Block user
          </Button>
        )}
      </div>

      {user.status === 'BLOCKED' ? (
        <Alert variant='destructive'>
          <BanIcon />
          <AlertTitle>Account blocked</AlertTitle>
          <AlertDescription>
            {user.blockedReason ?? 'No reason was recorded.'}
            {user.blockedAt ? (
              <>
                {' '}
                Blocked <Timestamp value={user.blockedAt} withTime />
                {user.blockedBy ? ` by ${user.blockedBy}` : null}.
              </>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className='grid gap-3 lg:grid-cols-2 lg:gap-6'>
        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>Account</CardTitle>
            <CardDescription>From auth_user and its credentials row.</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col divide-y'>
            <DetailRow label='Id'>{user.id}</DetailRow>
            <DetailRow label='Uid'>
              <code className='text-xs break-all'>{user.uid}</code>
            </DetailRow>
            <DetailRow label='Email'>{user.email}</DetailRow>
            <DetailRow label='Created'>
              <Timestamp value={user.createdAt} withTime />
            </DetailRow>
            <DetailRow label='Updated'>
              <Timestamp value={user.updatedAt} withTime />
            </DetailRow>
            <DetailRow label='Last reset'>
              <Timestamp value={user.lastReset} withTime />
            </DetailRow>
          </CardContent>
        </Card>

        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>Status</CardTitle>
            <CardDescription>GET /api/v1/admin/users/{'{uid}'}/status</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col divide-y'>
            <DetailRow label='Status'>
              <UserStatusBadge status={status.status} />
            </DetailRow>
            <DetailRow label='Auth version'>{status.authVersion}</DetailRow>
            <DetailRow label='Blocked at'>
              <Timestamp value={status.blockedAt} withTime />
            </DetailRow>
            <DetailRow label='Blocked reason'>{status.blockedReason ?? '-'}</DetailRow>
            <DetailRow label='Blocked by'>
              {status.blockedBy ? <code className='text-xs break-all'>{status.blockedBy}</code> : '-'}
            </DetailRow>
          </CardContent>
        </Card>

        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>Subscription</CardTitle>
            <CardDescription>From auth_user_subscription.</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col divide-y'>
            {user.subscription ? (
              <>
                <DetailRow label='Plan'>
                  <Badge variant='secondary'>{user.subscription.code}</Badge>
                </DetailRow>
                <DetailRow label='Ends'>
                  <Timestamp value={user.subscription.endSubscriptionDate} withTime />
                </DetailRow>
                <DetailRow label='Updated'>
                  <Timestamp value={user.subscription.updatedAt} withTime />
                </DetailRow>
              </>
            ) : (
              <p className='text-muted-foreground py-2 text-sm'>
                No subscription. The learner is on the free tier and can only open FREE courses.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>Roles</CardTitle>
            <CardDescription>
              ROLE_AUTHOR unlocks /api/v1/manager/**, ROLE_ADMIN unlocks /api/v1/admin/**. No endpoint grants roles yet,
              so these changes are local to this fixture.
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-3'>
            {(['ROLE_AUTHOR', 'ROLE_ADMIN'] as const).map(role => (
              <div key={role} className='flex items-center justify-between gap-3'>
                <div className='flex flex-col gap-0.5'>
                  <span className='text-sm font-medium'>{ROLE_LABELS[role]}</span>
                  <span className='text-muted-foreground text-xs'>{role}</span>
                </div>
                <Switch
                  checked={user.roles.includes(role)}
                  onCheckedChange={granted => toggleRole(role, granted)}
                  aria-label={`Toggle ${ROLE_LABELS[role]}`}
                />
              </div>
            ))}
            <p className='text-muted-foreground text-xs'>ROLE_USER is implicit for every account.</p>
          </CardContent>
        </Card>
      </div>

      <BlockUserDialog
        user={blocking ? user : null}
        onOpenChange={open => !open && setBlocking(false)}
        onConfirm={reason => {
          blockUser(reason)
          toast.success(`${user.username} blocked`)
        }}
      />
    </div>
  )
}
