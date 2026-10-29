'use client'

import { useMemo, useState } from 'react'

import type { ColumnDef } from '@tanstack/react-table'
import { HashIcon, LinkIcon, PencilIcon, PlusIcon, TagsIcon, Trash2Icon, UnlinkIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CategoryRow, CategorySortColumn } from '@/hooks/wordzen/use-category-list'
import { useCategoryList } from '@/hooks/wordzen/use-category-list'
import { useTranslation } from '@/lib/i18n'
import type { CourseCategoryPayload } from '@/types/wordzen/content-types'

import { DataTable } from '../shared/data-table'
import { ConfirmDialog, StatCards } from '../shared/primitives'
import { TablePagination, TableToolbar } from '../shared/table-chrome'
import { CategoryFormSheet } from './category-form-sheet'

export function CategoryList() {
  const { t } = useTranslation()
  const list = useCategoryList()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CategoryRow | null>(null)

  // All nine codes taken means there is no row left to create.
  const codesExhausted = list.availableCodes.length === 0

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (category: CategoryRow) => {
    setEditing(category)
    setFormOpen(true)
  }

  const handleSubmit = (payload: CourseCategoryPayload) => {
    if (editing) {
      list.updateCategory(editing.code, payload)
      toast.success(t('manage.categories.toast.updated', { name: payload.name }))

      return
    }

    list.createCategory(payload)
    toast.success(t('manage.categories.toast.created', { name: payload.name }))
  }

  const handleDelete = (category: CategoryRow) => {
    if (!list.deleteCategory(category.code)) {
      toast.error(t('manage.categories.toast.deleteBlocked', { name: category.name }))

      return
    }

    toast.success(t('manage.categories.toast.deleted', { name: category.name }))
  }

  const columns = useMemo<ColumnDef<CategoryRow>[]>(
    () => [
      {
        id: 'code',
        header: t('manage.columns.code'),
        cell: ({ row }) => (
          <Badge variant='outline' className='font-mono text-[11px]'>
            {row.original.code}
          </Badge>
        )
      },
      {
        id: 'name',
        header: t('manage.columns.name'),
        cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>
      },
      {
        id: 'courses',
        header: t('manage.columns.courses'),
        cell: ({ row }) =>
          row.original.courseCount === 0 ? (
            <span className='text-muted-foreground text-sm'>{t('manage.categories.unused')}</span>
          ) : (
            <span className='text-sm'>{row.original.courseCount}</span>
          )
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>{t('common.actions')}</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const inUse = row.original.courseCount > 0

          return (
            <div className='flex items-center justify-end gap-1'>
              <Button
                variant='ghost'
                size='icon'
                aria-label={t('manage.rowActions.edit', { name: row.original.name })}
                onClick={() => openEdit(row.original)}
              >
                <PencilIcon className='size-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                aria-label={t('manage.rowActions.delete', { name: row.original.name })}
                className='text-muted-foreground hover:text-destructive'
                disabled={inUse}
                title={inUse ? t('manage.categories.delete.blockedHint') : undefined}
                onClick={() => setPendingDelete(row.original)}
              >
                <Trash2Icon className='size-4' />
              </Button>
            </div>
          )
        }
      }
    ],
    [t]
  )

  return (
    <div className='flex flex-col gap-3 lg:gap-6'>
      <StatCards
        items={[
          {
            icon: <TagsIcon className='size-4' />,
            label: t('manage.categories.stats.categories'),
            value: list.stats.categoryCount
          },
          {
            icon: <LinkIcon className='size-4' />,
            label: t('manage.categories.stats.inUse'),
            value: list.stats.inUseCount,
            hint: t('manage.categories.stats.inUseHint')
          },
          {
            icon: <UnlinkIcon className='size-4' />,
            label: t('manage.categories.stats.unused'),
            value: list.stats.unusedCount,
            hint: t('manage.categories.stats.unusedHint')
          },
          {
            icon: <HashIcon className='size-4' />,
            label: t('manage.categories.stats.freeCodes'),
            value: list.stats.availableCodeCount,
            hint: t('manage.categories.stats.freeCodesHint')
          }
        ]}
      />

      <Card className='py-0 shadow-none'>
        <div className='w-full'>
          <TableToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder={t('manage.categories.searchPlaceholder')}
            rowsPerPage={list.rowsPerPage}
            onRowsPerPageChange={list.setRowsPerPage}
            filters={
              <Select value={list.usage} onValueChange={value => list.setUsage(value as typeof list.usage)}>
                <SelectTrigger className='w-36' aria-label={t('manage.filters.usage')}>
                  <SelectValue placeholder={t('manage.filters.usagePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('manage.filters.allUsage')}</SelectItem>
                  <SelectItem value='inUse'>{t('manage.filters.inUse')}</SelectItem>
                  <SelectItem value='unused'>{t('manage.filters.unused')}</SelectItem>
                </SelectContent>
              </Select>
            }
            actions={
              <Button
                onClick={openCreate}
                disabled={codesExhausted}
                title={codesExhausted ? t('manage.categories.allCodesUsed') : undefined}
              >
                <PlusIcon className='size-4' />
                {t('manage.categories.newCategory')}
              </Button>
            }
          />

          <DataTable<CategoryRow, CategorySortColumn>
            rows={list.categories}
            columns={columns}
            sorting={list.sorting}
            onSortingChange={list.setSorting}
            getRowId={category => category.code}
            emptyMessage={t('manage.categories.empty')}
          />

          <TablePagination
            showingFrom={list.showingFrom}
            showingTo={list.showingTo}
            total={list.total}
            page={list.page}
            totalPages={list.totalPages}
            onPageChange={list.setPage}
            noun={t('manage.nouns.categories')}
          />
        </div>
      </Card>

      <CategoryFormSheet
        open={formOpen}
        category={editing}
        availableCodes={list.availableCodes}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={open => !open && setPendingDelete(null)}
        title={t('manage.categories.delete.title')}
        description={
          pendingDelete ? (
            <>
              <strong>
                {pendingDelete.code} - {pendingDelete.name}
              </strong>{' '}
              {t('manage.categories.delete.description')}
            </>
          ) : null
        }
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
      />
    </div>
  )
}
