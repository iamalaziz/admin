'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import type { ColumnDef } from '@tanstack/react-table'
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  LayersIcon,
  LayoutGridIcon,
  MessageSquareQuoteIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { mockStore } from '@/hooks/wordzen/use-mock-store'
import type { ModuleSortColumn } from '@/hooks/wordzen/use-module-list'
import { useModuleList } from '@/hooks/wordzen/use-module-list'
import { useTranslation } from '@/lib/i18n'
import type { CoursePayload, Module, ModulePayload } from '@/types/wordzen/content-types'

import { ModuleFormSheet } from '../modules/module-form-sheet'
import { DataTable } from '../shared/data-table'
import {
  AccessBadge,
  ConfirmDialog,
  DetailRow,
  FilePathCell,
  LocaleBadge,
  PublishedBadge,
  StatCards,
  Timestamp
} from '../shared/primitives'
import { TablePagination, TableToolbar } from '../shared/table-chrome'
import { CourseFormSheet } from './course-form-sheet'

export function CourseDetail({ courseId }: { courseId: number }) {
  const { t } = useTranslation()
  const list = useModuleList(courseId)

  const [courseFormOpen, setCourseFormOpen] = useState(false)
  const [moduleFormOpen, setModuleFormOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Module | null>(null)

  const course = list.course

  const columns = useMemo<ColumnDef<Module>[]>(
    () => [
      {
        id: 'title',
        header: t('manage.columns.module'),
        cell: ({ row }) => (
          <div className='flex min-w-0 flex-col'>
            <Link href={`/manage/modules/${row.original.id}`} className='truncate font-medium hover:underline'>
              {row.original.title}
            </Link>
            <span className='text-muted-foreground text-xs'>#{row.original.displayOrder}</span>
          </div>
        )
      },
      {
        id: 'published',
        header: t('manage.columns.state'),
        cell: ({ row }) => <PublishedBadge isPublic={row.original.isPublic} />
      },
      {
        id: 'cards',
        header: t('manage.columns.cards'),
        cell: ({ row }) => <span className='text-sm'>{row.original.cardCount}</span>
      },
      {
        id: 'phrases',
        header: t('manage.columns.phrases'),
        cell: ({ row }) => <span className='text-sm'>{row.original.phraseCardCount}</span>
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
              onClick={() => list.moveModule(row.original, -1)}
            >
              <ChevronUpIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.moveDown', { name: row.original.title })}
              disabled={row.original.displayOrder >= list.totals.moduleCount}
              onClick={() => list.moveModule(row.original, 1)}
            >
              <ChevronDownIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.edit', { name: row.original.title })}
              onClick={() => {
                setEditingModule(row.original)
                setModuleFormOpen(true)
              }}
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

  if (!course) {
    return (
      <Card className='shadow-none'>
        <CardContent className='flex flex-col items-start gap-3 py-10'>
          <p className='font-medium'>{t('manage.courseDetail.notFound', { id: courseId })}</p>
          <p className='text-muted-foreground text-sm'>{t('manage.courseDetail.notFoundHint')}</p>
          <Button render={<Link href='/manage/courses' />} nativeButton={false} variant='outline'>
            <ArrowLeftIcon className='size-4' />
            {t('manage.courseDetail.backToCourses')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleCourseSubmit = (payload: CoursePayload) => {
    mockStore.updateCourse(courseId, payload)
    toast.success(t('manage.courseDetail.toast.courseUpdated', { title: payload.title }))
  }

  const handleModuleSubmit = (payload: ModulePayload) => {
    if (editingModule) {
      list.updateModule(editingModule.id, payload)
      toast.success(t('manage.courseDetail.toast.moduleUpdated', { title: payload.title }))

      return
    }

    list.createModule(payload)
    toast.success(t('manage.courseDetail.toast.moduleCreated', { title: payload.title }))
  }

  return (
    <div className='flex flex-col gap-3 lg:gap-6'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-col gap-1'>
          <Button
            render={<Link href='/manage/courses' />}
            nativeButton={false}
            variant='ghost'
            size='sm'
            className='-ml-2 w-fit'
          >
            <ArrowLeftIcon className='size-4' />
            {t('manage.courseDetail.allCourses')}
          </Button>
          <h1 className='truncate text-2xl font-semibold'>{course.title}</h1>
          <div className='flex flex-wrap items-center gap-2'>
            <PublishedBadge isPublic={course.isPublic} />
            <AccessBadge accessCode={course.accessCode} />
            <span className='text-muted-foreground text-sm'>
              {course.category.code} · {course.category.name}
            </span>
          </div>
        </div>
        <Button variant='outline' onClick={() => setCourseFormOpen(true)}>
          <PencilIcon className='size-4' />
          {t('manage.courseDetail.editCourse')}
        </Button>
      </div>

      <StatCards
        items={[
          {
            icon: <LayersIcon className='size-4' />,
            label: t('manage.courseDetail.stats.modules'),
            value: list.totals.moduleCount
          },
          {
            icon: <EyeIcon className='size-4' />,
            label: t('manage.courseDetail.stats.published'),
            value: list.totals.publishedCount
          },
          {
            icon: <LayoutGridIcon className='size-4' />,
            label: t('manage.courseDetail.stats.cards'),
            value: list.totals.cardCount,
            hint: t('manage.courseDetail.stats.cardsHint')
          },
          {
            icon: <MessageSquareQuoteIcon className='size-4' />,
            label: t('manage.courseDetail.stats.phraseCards'),
            value: list.totals.phraseCardCount
          }
        ]}
      />

      <div className='grid gap-3 lg:grid-cols-3 lg:gap-6'>
        <Card className='shadow-none lg:col-span-1'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.courseDetail.infoTitle')}</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col divide-y'>
            <DetailRow label={t('manage.courseDetail.fields.id')}>{course.id}</DetailRow>
            <DetailRow label={t('manage.courseDetail.fields.author')}>{course.authorUsername}</DetailRow>
            <DetailRow label={t('manage.courseDetail.fields.displayOrder')}>#{course.displayOrder}</DetailRow>
            <DetailRow label={t('manage.courseDetail.fields.created')}>
              <Timestamp value={course.createdAt} withTime />
            </DetailRow>
            <DetailRow label={t('manage.courseDetail.fields.cover')}>
              <FilePathCell path={course.cover} />
            </DetailRow>
          </CardContent>
        </Card>

        <Card className='shadow-none lg:col-span-2'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.courseDetail.descriptions.title')}</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-3'>
            {course.descriptions.length === 0 ? (
              <p className='text-muted-foreground text-sm'>{t('manage.courseDetail.descriptions.empty')}</p>
            ) : (
              course.descriptions.map((description, index) => (
                <div key={description.id} className='flex flex-col gap-1.5'>
                  {index > 0 ? <Separator className='mb-2' /> : null}
                  <LocaleBadge locale={description.locale} />
                  <p className='text-sm leading-relaxed'>{description.value}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className='py-0 shadow-none'>
        <div className='w-full'>
          <TableToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder={t('manage.courseDetail.searchPlaceholder')}
            rowsPerPage={list.rowsPerPage}
            onRowsPerPageChange={list.setRowsPerPage}
            filters={
              <Select value={list.published} onValueChange={value => list.setPublished(value as typeof list.published)}>
                <SelectTrigger className='w-32' aria-label={t('manage.filters.state')}>
                  <SelectValue placeholder={t('manage.filters.statePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('manage.filters.allStates')}</SelectItem>
                  <SelectItem value='public'>{t('manage.badges.public')}</SelectItem>
                  <SelectItem value='draft'>{t('manage.badges.draft')}</SelectItem>
                </SelectContent>
              </Select>
            }
            actions={
              <Button
                onClick={() => {
                  setEditingModule(null)
                  setModuleFormOpen(true)
                }}
              >
                <PlusIcon className='size-4' />
                {t('manage.courseDetail.newModule')}
              </Button>
            }
          />

          <DataTable<Module, ModuleSortColumn>
            rows={list.modules}
            columns={columns}
            sorting={list.sorting}
            onSortingChange={list.setSorting}
            getRowId={module => String(module.id)}
            emptyMessage={t('manage.courseDetail.empty')}
          />

          <TablePagination
            showingFrom={list.showingFrom}
            showingTo={list.showingTo}
            total={list.total}
            page={list.page}
            totalPages={list.totalPages}
            onPageChange={list.setPage}
            noun={t('manage.nouns.modules')}
          />
        </div>
      </Card>

      <CourseFormSheet
        open={courseFormOpen}
        course={course}
        onOpenChange={setCourseFormOpen}
        onSubmit={handleCourseSubmit}
      />

      <ModuleFormSheet
        open={moduleFormOpen}
        module={editingModule}
        course={course}
        onOpenChange={setModuleFormOpen}
        onSubmit={handleModuleSubmit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={open => !open && setPendingDelete(null)}
        title={t('manage.courseDetail.moduleDelete.title')}
        description={
          pendingDelete ? (
            <>
              <strong>{pendingDelete.title}</strong>{' '}
              {t('manage.courseDetail.moduleDelete.description', { count: pendingDelete.cardCount })}
            </>
          ) : null
        }
        onConfirm={() => {
          if (!pendingDelete) {
            return
          }

          list.deleteModule(pendingDelete.id)
          toast.success(t('manage.courseDetail.toast.moduleDeleted', { title: pendingDelete.title }))
        }}
      />
    </div>
  )
}
