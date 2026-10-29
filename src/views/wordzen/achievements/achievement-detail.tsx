'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeftIcon, CircleSlashIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RecipientSortColumn } from '@/hooks/wordzen/use-achievement-list'
import { useAchievementDetail } from '@/hooks/wordzen/use-achievement-list'
import { useTranslation } from '@/lib/i18n'
import type { AchievementPayload, AchievementRecipient } from '@/types/wordzen/achievement-types'

import { DataTable } from '../shared/data-table'
import { ActiveBadge, ConfirmDialog, DetailRow, Timestamp, UserStatusBadge } from '../shared/primitives'
import { TablePagination, TableToolbar } from '../shared/table-chrome'
import { AchievementFormSheet } from './achievement-form-sheet'

export function AchievementDetail({ code }: { code: string }) {
  const { t } = useTranslation()
  const list = useAchievementDetail(code)

  const [formOpen, setFormOpen] = useState(false)
  const [pendingRevoke, setPendingRevoke] = useState<AchievementRecipient | null>(null)

  const achievement = list.achievement

  const columns = useMemo<ColumnDef<AchievementRecipient>[]>(
    () => [
      {
        id: 'username',
        header: t('manage.columns.user'),
        cell: ({ row }) => (
          <div className='flex min-w-0 flex-col'>
            <Link href={`/manage/users/${row.original.uid}`} className='truncate font-medium hover:underline'>
              {row.original.username}
            </Link>
            <span className='text-muted-foreground truncate text-xs'>{row.original.email}</span>
          </div>
        )
      },
      {
        id: 'status',
        header: t('manage.columns.status'),
        cell: ({ row }) => <UserStatusBadge status={row.original.status} />
      },
      {
        id: 'received',
        header: t('manage.columns.received'),
        cell: ({ row }) => (
          <span className='text-muted-foreground text-sm'>
            <Timestamp value={row.original.receivedAt} withTime />
          </span>
        )
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>{t('common.actions')}</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <Button
              variant='ghost'
              size='sm'
              className='text-muted-foreground hover:text-destructive'
              onClick={() => setPendingRevoke(row.original)}
            >
              <Trash2Icon className='size-4' />
              {t('manage.achievementDetail.revoke')}
            </Button>
          </div>
        )
      }
    ],
    [t]
  )

  if (!achievement) {
    return (
      <Card className='shadow-none'>
        <CardContent className='flex flex-col items-start gap-3 py-10'>
          <p className='font-medium'>{t('manage.achievementDetail.notFound', { code })}</p>
          <p className='text-muted-foreground text-sm'>{t('manage.achievementDetail.notFoundHint')}</p>
          <Button render={<Link href='/manage/achievements' />} nativeButton={false} variant='outline'>
            <ArrowLeftIcon className='size-4' />
            {t('manage.achievementDetail.backToAchievements')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = (payload: AchievementPayload) => {
    list.updateAchievement(payload)
    toast.success(t('manage.achievementDetail.toast.updated', { title: payload.title }))
  }

  return (
    <div className='flex flex-col gap-3 lg:gap-6'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-col gap-1'>
          <Button
            render={<Link href='/manage/achievements' />}
            nativeButton={false}
            variant='ghost'
            size='sm'
            className='-ml-2 w-fit'
          >
            <ArrowLeftIcon className='size-4' />
            {t('manage.achievementDetail.allAchievements')}
          </Button>
          <h1 className='truncate text-2xl font-semibold'>{achievement.title}</h1>
          <div className='flex flex-wrap items-center gap-2'>
            <ActiveBadge active={achievement.active} />
            <span className='text-muted-foreground text-sm'>{achievement.group.title}</span>
            <code className='bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs'>{achievement.code}</code>
          </div>
        </div>
        <Button variant='outline' onClick={() => setFormOpen(true)}>
          <PencilIcon className='size-4' />
          {t('manage.achievementDetail.editAchievement')}
        </Button>
      </div>

      {achievement.active ? null : (
        <Alert>
          <CircleSlashIcon />
          <AlertTitle>{t('manage.achievementDetail.inactiveAlert.title')}</AlertTitle>
          <AlertDescription>{t('manage.achievementDetail.inactiveAlert.description')}</AlertDescription>
        </Alert>
      )}

      <div className='grid gap-3 lg:grid-cols-3 lg:gap-6'>
        <Card className='shadow-none lg:col-span-1'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.achievementDetail.infoTitle')}</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col divide-y'>
            <DetailRow label={t('manage.achievementDetail.fields.id')}>{achievement.id}</DetailRow>
            <DetailRow label={t('manage.achievementDetail.fields.code')}>
              <code className='text-xs break-all'>{achievement.code}</code>
            </DetailRow>
            <DetailRow label={t('manage.achievementDetail.fields.group')}>
              {achievement.group.title} · <code className='text-xs'>{achievement.group.code}</code>
            </DetailRow>
            <DetailRow label={t('manage.achievementDetail.fields.displayOrder')}>#{achievement.displayOrder}</DetailRow>
            <DetailRow label={t('manage.achievementDetail.fields.state')}>
              <ActiveBadge active={achievement.active} />
            </DetailRow>
            <DetailRow label={t('manage.achievementDetail.fields.recipients')}>{achievement.receivedCount}</DetailRow>
          </CardContent>
        </Card>

        <Card className='shadow-none lg:col-span-2'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.achievementDetail.condition.title')}</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-3'>
            <p className='text-sm leading-relaxed'>{achievement.description}</p>
            <p className='text-muted-foreground text-xs'>{t('manage.achievementDetail.condition.hint')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className='py-0 shadow-none'>
        <div className='w-full'>
          <TableToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder={t('manage.achievementDetail.searchPlaceholder')}
            rowsPerPage={list.rowsPerPage}
            onRowsPerPageChange={list.setRowsPerPage}
          />

          <DataTable<AchievementRecipient, RecipientSortColumn>
            rows={list.recipients}
            columns={columns}
            sorting={list.sorting}
            onSortingChange={list.setSorting}
            getRowId={recipient => recipient.uid}
            emptyMessage={t('manage.achievementDetail.empty')}
          />

          <TablePagination
            showingFrom={list.showingFrom}
            showingTo={list.showingTo}
            total={list.total}
            page={list.page}
            totalPages={list.totalPages}
            onPageChange={list.setPage}
            noun={t('manage.nouns.recipients')}
          />
        </div>
      </Card>

      <AchievementFormSheet
        open={formOpen}
        achievement={achievement}
        takenCodes={[achievement.code]}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingRevoke !== null}
        onOpenChange={open => !open && setPendingRevoke(null)}
        title={t('manage.achievementDetail.revokeDialog.title')}
        description={
          pendingRevoke ? (
            <>
              <strong>{pendingRevoke.username}</strong>{' '}
              {t('manage.achievementDetail.revokeDialog.description', { title: achievement.title })}
            </>
          ) : null
        }
        confirmLabel={t('manage.achievementDetail.revoke')}
        onConfirm={() => {
          if (!pendingRevoke) {
            return
          }

          list.revokeAchievement(pendingRevoke.uid)
          toast.success(
            t('manage.achievementDetail.toast.revoked', {
              title: achievement.title,
              name: pendingRevoke.username
            })
          )
        }}
      />
    </div>
  )
}
