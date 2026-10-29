'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import type { ColumnDef } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AchievementSortColumn } from '@/hooks/wordzen/use-achievement-list'
import { useAchievementList } from '@/hooks/wordzen/use-achievement-list'
import { useTranslation } from '@/lib/i18n'
import type { Achievement, AchievementPayload } from '@/types/wordzen/achievement-types'
import { SEED_ACHIEVEMENT_GROUPS } from '@/types/wordzen/achievement-types'

import { DataTable } from '../shared/data-table'
import { ActiveBadge, ConfirmDialog, StatCards } from '../shared/primitives'
import { TablePagination, TableToolbar } from '../shared/table-chrome'
import { AchievementFormSheet } from './achievement-form-sheet'

export function AchievementList() {
  const { t } = useTranslation()
  const list = useAchievementList()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Achievement | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Achievement | null>(null)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (achievement: Achievement) => {
    setEditing(achievement)
    setFormOpen(true)
  }

  const handleSubmit = (payload: AchievementPayload) => {
    if (editing) {
      list.updateAchievement(editing.code, payload)
      toast.success(t('manage.achievements.toast.updated', { title: payload.title }))

      return
    }

    if (!list.createAchievement(payload)) {
      toast.error(t('manage.achievements.toast.codeTaken', { code: payload.code }))

      return
    }

    toast.success(t('manage.achievements.toast.created', { title: payload.title }))
  }

  const handleDelete = (achievement: Achievement) => {
    list.deleteAchievement(achievement.code)
    toast.success(t('manage.achievements.toast.deleted', { title: achievement.title }))
  }

  const columns = useMemo<ColumnDef<Achievement>[]>(
    () => [
      {
        id: 'title',
        header: t('manage.columns.achievement'),
        cell: ({ row }) => (
          <div className='flex min-w-0 flex-col'>
            <Link
              href={`/manage/achievements/${row.original.code}`}
              className='truncate font-medium hover:underline'
              title={row.original.description}
            >
              {row.original.title}
            </Link>
            <span className='text-muted-foreground truncate font-mono text-xs'>
              #{row.original.displayOrder} · {row.original.code}
            </span>
          </div>
        )
      },
      {
        id: 'group',
        header: t('manage.columns.group'),
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <span className='text-sm'>{row.original.group.title}</span>
            <span className='text-muted-foreground font-mono text-xs'>{row.original.group.code}</span>
          </div>
        )
      },
      {
        id: 'description',
        header: t('manage.columns.condition'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className='text-muted-foreground line-clamp-2 max-w-72 text-sm'>{row.original.description}</span>
        )
      },
      {
        id: 'state',
        header: t('manage.columns.state'),
        cell: ({ row }) => <ActiveBadge active={row.original.active} />
      },
      {
        id: 'recipients',
        header: t('manage.columns.recipients'),
        cell: ({ row }) => <span className='text-sm'>{row.original.receivedCount}</span>
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>{t('common.actions')}</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className='flex items-center justify-end gap-1'>
            <Button
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.moveUp', { name: row.original.title })}
              disabled={row.original.displayOrder <= 1}
              onClick={() => list.moveAchievement(row.original, -1)}
            >
              <ChevronUpIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.moveDown', { name: row.original.title })}
              disabled={row.original.displayOrder >= list.stats.achievementCount}
              onClick={() => list.moveAchievement(row.original, 1)}
            >
              <ChevronDownIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.edit', { name: row.original.title })}
              onClick={() => openEdit(row.original)}
            >
              <PencilIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.delete', { name: row.original.title })}
              className='text-muted-foreground hover:text-destructive'
              onClick={() => setPendingDelete(row.original)}
            >
              <Trash2Icon className='size-4' />
            </Button>
          </div>
        )
      }
    ],
    [list, t]
  )

  return (
    <div className='flex flex-col gap-3 lg:gap-6'>
      <StatCards
        items={[
          { label: t('manage.achievements.stats.achievements'), value: list.stats.achievementCount },
          {
            label: t('manage.achievements.stats.active'),
            value: list.stats.activeCount,
            hint: t('manage.achievements.stats.activeHint')
          },
          {
            label: t('manage.achievements.stats.groups'),
            value: list.stats.groupCount,
            hint: t('manage.achievements.stats.groupsHint')
          },
          {
            label: t('manage.achievements.stats.grants'),
            value: list.stats.grantCount,
            hint: t('manage.achievements.stats.grantsHint')
          }
        ]}
      />

      <Card className='py-0 shadow-none'>
        <div className='w-full'>
          <TableToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder={t('manage.achievements.searchPlaceholder')}
            rowsPerPage={list.rowsPerPage}
            onRowsPerPageChange={list.setRowsPerPage}
            filters={
              <>
                <Select
                  value={list.filters.group}
                  onValueChange={value => list.setFilters({ group: value as typeof list.filters.group })}
                >
                  <SelectTrigger className='w-40' aria-label={t('manage.filters.group')}>
                    <SelectValue placeholder={t('manage.filters.groupPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('manage.filters.allGroups')}</SelectItem>
                    {SEED_ACHIEVEMENT_GROUPS.map(group => (
                      <SelectItem key={group.code} value={group.code}>
                        {group.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={list.filters.state}
                  onValueChange={value => list.setFilters({ state: value as typeof list.filters.state })}
                >
                  <SelectTrigger className='w-32' aria-label={t('manage.filters.state')}>
                    <SelectValue placeholder={t('manage.filters.statePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('manage.filters.allStates')}</SelectItem>
                    <SelectItem value='active'>{t('manage.badges.active')}</SelectItem>
                    <SelectItem value='inactive'>{t('manage.badges.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
            actions={
              <Button onClick={openCreate}>
                <PlusIcon className='size-4' />
                {t('manage.achievements.newAchievement')}
              </Button>
            }
          />

          <DataTable<Achievement, AchievementSortColumn>
            rows={list.achievements}
            columns={columns}
            sorting={list.sorting}
            onSortingChange={list.setSorting}
            getRowId={achievement => achievement.code}
            emptyMessage={t('manage.achievements.empty')}
          />

          <TablePagination
            showingFrom={list.showingFrom}
            showingTo={list.showingTo}
            total={list.total}
            page={list.page}
            totalPages={list.totalPages}
            onPageChange={list.setPage}
            noun={t('manage.nouns.achievements')}
          />
        </div>
      </Card>

      <AchievementFormSheet
        open={formOpen}
        achievement={editing}
        takenCodes={list.codes}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={open => !open && setPendingDelete(null)}
        title={t('manage.achievements.delete.title')}
        description={
          pendingDelete ? (
            <>
              <strong>{pendingDelete.title}</strong>{' '}
              {t('manage.achievements.delete.description', { count: pendingDelete.receivedCount })}
            </>
          ) : null
        }
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
      />
    </div>
  )
}
