'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import type { ColumnDef } from '@tanstack/react-table'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CreditCardIcon,
  EyeIcon,
  LayersIcon,
  LibraryBigIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCourseCategories } from '@/hooks/wordzen/use-category-list'
import type { CourseSortColumn } from '@/hooks/wordzen/use-course-list'
import { useCourseList } from '@/hooks/wordzen/use-course-list'
import { useTranslation } from '@/lib/i18n'
import type { Course, CoursePayload } from '@/types/wordzen/content-types'
import { COURSE_ACCESS_CODES } from '@/types/wordzen/content-types'

import { DataTable } from '../shared/data-table'
import { AccessBadge, ConfirmDialog, PublishedBadge, StatCards, Timestamp } from '../shared/primitives'
import { TablePagination, TableToolbar } from '../shared/table-chrome'
import { CourseFormSheet } from './course-form-sheet'

export function CourseList() {
  const { t } = useTranslation()
  const list = useCourseList()
  const categories = useCourseCategories()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (course: Course) => {
    setEditing(course)
    setFormOpen(true)
  }

  const handleSubmit = (payload: CoursePayload) => {
    if (editing) {
      list.updateCourse(editing.id, payload)
      toast.success(t('manage.courses.toast.updated', { title: payload.title }))

      return
    }

    list.createCourse(payload)
    toast.success(t('manage.courses.toast.created', { title: payload.title }))
  }

  const handleDelete = (course: Course) => {
    list.deleteCourse(course.id)
    toast.success(t('manage.courses.toast.deleted', { title: course.title }))
  }

  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        id: 'title',
        header: t('manage.columns.course'),
        cell: ({ row }) => (
          <div className='flex min-w-0 flex-col'>
            <Link href={`/manage/courses/${row.original.id}`} className='truncate font-medium hover:underline'>
              {row.original.title}
            </Link>
            <span className='text-muted-foreground text-xs'>
              #{row.original.displayOrder} · {row.original.authorUsername}
            </span>
          </div>
        )
      },
      {
        id: 'category',
        header: t('manage.columns.category'),
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <span className='text-sm'>{row.original.category.code}</span>
            <span className='text-muted-foreground text-xs'>{row.original.category.name}</span>
          </div>
        )
      },
      {
        id: 'access',
        header: t('manage.columns.access'),
        cell: ({ row }) => <AccessBadge accessCode={row.original.accessCode} />
      },
      {
        id: 'published',
        header: t('manage.columns.state'),
        cell: ({ row }) => <PublishedBadge isPublic={row.original.isPublic} />
      },
      {
        id: 'modules',
        header: t('manage.columns.modules'),
        cell: ({ row }) => <span className='text-sm'>{row.original.moduleCount}</span>
      },
      {
        id: 'created',
        header: t('manage.columns.created'),
        cell: ({ row }) => (
          <span className='text-muted-foreground text-sm'>
            <Timestamp value={row.original.createdAt} />
          </span>
        )
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
              onClick={() => list.moveCourse(row.original, -1)}
            >
              <ChevronUpIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.moveDown', { name: row.original.title })}
              disabled={row.original.displayOrder >= list.stats.courseCount}
              onClick={() => list.moveCourse(row.original, 1)}
            >
              <ChevronDownIcon className='size-4' />
            </Button>
            <Button
              render={<Link href={`/manage/courses/${row.original.id}`} />}
              nativeButton={false}
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.open', { name: row.original.title })}
            >
              <EyeIcon className='size-4' />
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
          {
            icon: <LibraryBigIcon className='size-4' />,
            label: t('manage.courses.stats.courses'),
            value: list.stats.courseCount
          },
          {
            icon: <EyeIcon className='size-4' />,
            label: t('manage.courses.stats.published'),
            value: list.stats.publishedCourseCount,
            hint: t('manage.courses.stats.publishedHint')
          },
          {
            icon: <LayersIcon className='size-4' />,
            label: t('manage.courses.stats.modules'),
            value: list.stats.moduleCount,
            hint: t('manage.courses.stats.modulesHint')
          },
          {
            icon: <CreditCardIcon className='size-4' />,
            label: t('manage.courses.stats.paid'),
            value: list.stats.paidCourseCount,
            hint: t('manage.courses.stats.paidHint')
          }
        ]}
      />

      <Card className='py-0 shadow-none'>
        <div className='w-full'>
          <TableToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder={t('manage.courses.searchPlaceholder')}
            rowsPerPage={list.rowsPerPage}
            onRowsPerPageChange={list.setRowsPerPage}
            filters={
              <>
                <Select
                  value={list.filters.category}
                  onValueChange={value => list.setFilters({ category: value as typeof list.filters.category })}
                >
                  <SelectTrigger className='w-40' aria-label={t('manage.filters.category')}>
                    <SelectValue placeholder={t('manage.filters.categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('manage.filters.allCategories')}</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.code} value={category.code}>
                        {category.code} - {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={list.filters.access}
                  onValueChange={value => list.setFilters({ access: value as typeof list.filters.access })}
                >
                  <SelectTrigger className='w-32' aria-label={t('manage.filters.access')}>
                    <SelectValue placeholder={t('manage.filters.accessPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('manage.filters.allAccess')}</SelectItem>
                    {COURSE_ACCESS_CODES.map(code => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={list.filters.published}
                  onValueChange={value => list.setFilters({ published: value as typeof list.filters.published })}
                >
                  <SelectTrigger className='w-32' aria-label={t('manage.filters.state')}>
                    <SelectValue placeholder={t('manage.filters.statePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('manage.filters.allStates')}</SelectItem>
                    <SelectItem value='public'>{t('manage.badges.public')}</SelectItem>
                    <SelectItem value='draft'>{t('manage.badges.draft')}</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
            actions={
              <Button onClick={openCreate}>
                <PlusIcon className='size-4' />
                {t('manage.courses.newCourse')}
              </Button>
            }
          />

          <DataTable<Course, CourseSortColumn>
            rows={list.courses}
            columns={columns}
            sorting={list.sorting}
            onSortingChange={list.setSorting}
            getRowId={course => String(course.id)}
            emptyMessage={t('manage.courses.empty')}
          />

          <TablePagination
            showingFrom={list.showingFrom}
            showingTo={list.showingTo}
            total={list.total}
            page={list.page}
            totalPages={list.totalPages}
            onPageChange={list.setPage}
            noun={t('manage.nouns.courses')}
          />
        </div>
      </Card>

      <CourseFormSheet open={formOpen} course={editing} onOpenChange={setFormOpen} onSubmit={handleSubmit} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={open => !open && setPendingDelete(null)}
        title={t('manage.courses.delete.title')}
        description={
          pendingDelete ? (
            <>
              <strong>{pendingDelete.title}</strong>{' '}
              {t('manage.courses.delete.description', { count: pendingDelete.moduleCount })}
            </>
          ) : null
        }
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
      />
    </div>
  )
}
