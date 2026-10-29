'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import type { ColumnDef } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CourseSortColumn } from '@/hooks/wordzen/use-course-list'
import { useCourseList } from '@/hooks/wordzen/use-course-list'
import type { Course, CoursePayload } from '@/types/wordzen/content-types'
import { COURSE_ACCESS_CODES, COURSE_CATEGORIES } from '@/types/wordzen/content-types'

import { DataTable } from '../shared/data-table'
import { AccessBadge, ConfirmDialog, PublishedBadge, StatCards, Timestamp } from '../shared/primitives'
import { TablePagination, TableToolbar } from '../shared/table-chrome'
import { CourseFormSheet } from './course-form-sheet'

export function CourseList() {
  const list = useCourseList()

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
      toast.success(`Course "${payload.title}" updated`)

      return
    }

    list.createCourse(payload)
    toast.success(`Course "${payload.title}" created`)
  }

  const handleDelete = (course: Course) => {
    list.deleteCourse(course.id)
    toast.success(`Course "${course.title}" deleted`)
  }

  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        id: 'title',
        header: 'Course',
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
        header: 'Category',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <span className='text-sm'>{row.original.category.code}</span>
            <span className='text-muted-foreground text-xs'>{row.original.category.name}</span>
          </div>
        )
      },
      {
        id: 'access',
        header: 'Access',
        cell: ({ row }) => <AccessBadge accessCode={row.original.accessCode} />
      },
      {
        id: 'published',
        header: 'State',
        cell: ({ row }) => <PublishedBadge isPublic={row.original.isPublic} />
      },
      {
        id: 'modules',
        header: 'Modules',
        cell: ({ row }) => <span className='text-sm'>{row.original.moduleCount}</span>
      },
      {
        id: 'created',
        header: 'Created',
        cell: ({ row }) => (
          <span className='text-muted-foreground text-sm'>
            <Timestamp value={row.original.createdAt} />
          </span>
        )
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className='flex items-center justify-end gap-1'>
            <Button
              variant='ghost'
              size='icon'
              aria-label={`Move ${row.original.title} up`}
              disabled={row.original.displayOrder <= 1}
              onClick={() => list.moveCourse(row.original, -1)}
            >
              <ChevronUpIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={`Move ${row.original.title} down`}
              disabled={row.original.displayOrder >= list.stats.courseCount}
              onClick={() => list.moveCourse(row.original, 1)}
            >
              <ChevronDownIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={`Edit ${row.original.title}`}
              onClick={() => openEdit(row.original)}
            >
              <PencilIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={`Delete ${row.original.title}`}
              className='text-muted-foreground hover:text-destructive'
              onClick={() => setPendingDelete(row.original)}
            >
              <Trash2Icon className='size-4' />
            </Button>
          </div>
        )
      }
    ],
    [list]
  )

  return (
    <div className='flex flex-col gap-3 lg:gap-6'>
      <StatCards
        items={[
          { label: 'Courses', value: list.stats.courseCount },
          { label: 'Published', value: list.stats.publishedCourseCount, hint: 'Visible to learners' },
          { label: 'Modules', value: list.stats.moduleCount, hint: 'Across all courses' },
          { label: 'Paid', value: list.stats.paidCourseCount, hint: 'BASIC or PRO' }
        ]}
      />

      <Card className='py-0 shadow-none'>
        <div className='w-full'>
          <TableToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder='Search title or author'
            rowsPerPage={list.rowsPerPage}
            onRowsPerPageChange={list.setRowsPerPage}
            filters={
              <>
                <Select
                  value={list.filters.category}
                  onValueChange={value => list.setFilters({ category: value as typeof list.filters.category })}
                >
                  <SelectTrigger className='w-40' aria-label='Filter by category'>
                    <SelectValue placeholder='Category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All categories</SelectItem>
                    {COURSE_CATEGORIES.map(category => (
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
                  <SelectTrigger className='w-32' aria-label='Filter by access'>
                    <SelectValue placeholder='Access' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All access</SelectItem>
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
                  <SelectTrigger className='w-32' aria-label='Filter by state'>
                    <SelectValue placeholder='State' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All states</SelectItem>
                    <SelectItem value='public'>Public</SelectItem>
                    <SelectItem value='draft'>Draft</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
            actions={
              <Button onClick={openCreate}>
                <PlusIcon className='size-4' />
                New course
              </Button>
            }
          />

          <DataTable<Course, CourseSortColumn>
            rows={list.courses}
            columns={columns}
            sorting={list.sorting}
            onSortingChange={list.setSorting}
            getRowId={course => String(course.id)}
            emptyMessage='No courses match these filters.'
          />

          <TablePagination
            showingFrom={list.showingFrom}
            showingTo={list.showingTo}
            total={list.total}
            page={list.page}
            totalPages={list.totalPages}
            onPageChange={list.setPage}
            noun='courses'
          />
        </div>
      </Card>

      <CourseFormSheet open={formOpen} course={editing} onOpenChange={setFormOpen} onSubmit={handleSubmit} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={open => !open && setPendingDelete(null)}
        title='Delete course?'
        description={
          pendingDelete ? (
            <>
              <strong>{pendingDelete.title}</strong> and its {pendingDelete.moduleCount} modules (with their cards) will
              be removed. The manager API deletes the rows outright — this cannot be undone.
            </>
          ) : null
        }
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
      />
    </div>
  )
}
