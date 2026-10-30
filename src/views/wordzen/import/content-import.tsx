'use client'

import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'

import Link from 'next/link'

import type { ColumnDef } from '@tanstack/react-table'
import {
  ArrowRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  DownloadIcon,
  FileUpIcon,
  LayersIcon,
  LayoutGridIcon,
  TriangleAlertIcon,
  UploadCloudIcon,
  XIcon
} from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mockStore, useStoreSelector } from '@/hooks/wordzen/use-mock-store'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Course, ImportResult, Module, ModuleImportPayload } from '@/types/wordzen/content-types'

import { DataTable } from '../shared/data-table'
import { PublishedBadge, StatCards } from '../shared/primitives'
import type { ImportDraft, ImportFormat, ImportIssue } from './import-parsers'
import { buildTemplate, MAX_IMPORT_MEGABYTES, parseImportFile } from './import-parsers'

type PreviewRow = {
  index: number
  module: ModuleImportPayload

  /** The course module the cards will be appended to, or null when the import creates one. */
  existing: Module | null
}

type CompletedImport = {
  course: Course
  result: ImportResult
}

/** How many terms the preview spells out before it switches to a count. */
const PREVIEW_TERM_COUNT = 4

const downloadTemplate = (format: ImportFormat) => {
  // The BOM is for Excel, which otherwise opens a UTF-8 CSV as ANSI and mangles the Cyrillic.
  const blob =
    format === 'csv'
      ? new Blob(['﻿', buildTemplate('csv')], { type: 'text/csv;charset=utf-8' })
      : new Blob([buildTemplate('json')], { type: 'application/json' })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `wordzen-import-template.${format}`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Bulk-creates modules and their cards in one course from a CSV or JSON file. The file is
 * parsed and checked in the browser first, and nothing is written until the preview has
 * no errors and the import is confirmed.
 */
export function ContentImport() {
  const { t } = useTranslation()

  const inputRef = useRef<HTMLInputElement>(null)

  // A newer file can finish parsing before an older one; only the latest may land.
  const parseToken = useRef(0)

  const [courseId, setCourseId] = useState<number | null>(null)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [draft, setDraft] = useState<ImportDraft | null>(null)
  const [draftId, setDraftId] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [completed, setCompleted] = useState<CompletedImport | null>(null)

  const courses = useStoreSelector(() => mockStore.listCourses())
  const course = courses.find(item => item.id === courseId) ?? null

  const rows = useStoreSelector<PreviewRow[]>(
    () =>
      (draft?.modules ?? []).map((moduleRow, index) => ({
        index,
        module: moduleRow,
        existing: course ? mockStore.findModuleByTitle(course.id, moduleRow.title) : null
      })),
    [course?.id ?? 0, draftId]
  )

  const issues = useMemo(
    () =>
      [...(draft?.issues ?? [])].sort((a, b) =>
        a.severity === b.severity ? (a.line ?? 0) - (b.line ?? 0) : a.severity === 'error' ? -1 : 1
      ),
    [draft]
  )

  const errorCount = issues.filter(issue => issue.severity === 'error').length
  const warningCount = issues.length - errorCount
  const cardCount = rows.reduce((total, row) => total + row.module.cards.length, 0)
  const existingCount = rows.filter(row => row.existing).length
  const canImport = course !== null && rows.length > 0 && errorCount === 0

  const columns = useMemo<ColumnDef<PreviewRow>[]>(
    () => [
      {
        id: 'title',
        header: t('manage.columns.module'),
        enableSorting: false,
        cell: ({ row }) => <span className='font-medium'>{row.original.module.title}</span>
      },
      {
        id: 'target',
        header: t('manage.import.preview.columns.target'),
        enableSorting: false,
        cell: ({ row }) =>
          !course ? (
            <span className='text-muted-foreground text-sm'>-</span>
          ) : row.original.existing ? (
            <Badge variant='secondary'>
              {t('manage.import.preview.existing', { order: row.original.existing.displayOrder })}
            </Badge>
          ) : (
            <Badge variant='outline'>{t('manage.import.preview.new')}</Badge>
          )
      },
      {
        id: 'state',
        header: t('manage.columns.state'),
        enableSorting: false,

        // What the module will be after the import: an existing one keeps its state, and
        // a draft course turns every new one into a draft, as `createModule` does.
        cell: ({ row }) => (
          <PublishedBadge
            isPublic={
              row.original.existing
                ? row.original.existing.isPublic
                : (course?.isPublic ?? true) && row.original.module.isPublic
            }
          />
        )
      },
      {
        id: 'cards',
        header: t('manage.columns.cards'),
        enableSorting: false,
        cell: ({ row }) => <span className='text-sm'>{row.original.module.cards.length}</span>
      },
      {
        id: 'terms',
        header: t('manage.import.preview.columns.terms'),
        enableSorting: false,
        cell: ({ row }) => {
          const terms = row.original.module.cards.map(card => card.term)
          const rest = terms.length - PREVIEW_TERM_COUNT

          return (
            <span className='text-muted-foreground block max-w-80 truncate text-sm'>
              {terms.slice(0, PREVIEW_TERM_COUNT).join(', ')}
              {rest > 0 ? ` ${t('manage.import.preview.moreTerms', { count: rest })}` : null}
            </span>
          )
        }
      }
    ],
    [course, t]
  )

  const readFile = async (next: File) => {
    const token = ++parseToken.current

    setFile(next)
    setCompleted(null)

    const parsed = await parseImportFile(next)

    if (token !== parseToken.current) {
      return
    }

    setDraft(parsed)
    setDraftId(id => id + 1)
  }

  const clearFile = () => {
    parseToken.current += 1
    setFile(null)
    setDraft(null)
    setDraftId(id => id + 1)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0]

    if (next) {
      void readFile(next)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)

    const next = event.dataTransfer.files[0]

    if (next) {
      void readFile(next)
    }
  }

  const handleImport = () => {
    if (!course || !draft || !canImport) {
      return
    }

    const result = mockStore.importModules(course.id, draft.modules, { skipDuplicateTerms: skipDuplicates })

    if (!result) {
      toast.error(t('manage.import.toast.courseMissing'))

      return
    }

    toast.success(
      t('manage.import.toast.imported', {
        cards: result.createdCards,
        modules: result.createdModules + result.appendedModules,
        title: course.title
      })
    )
    setCompleted({ course, result })
    clearFile()
  }

  const describeLocation = (issue: ImportIssue) =>
    issue.line !== undefined ? (
      <span className='text-foreground font-medium'>{t('manage.import.issues.line', { line: issue.line })}</span>
    ) : issue.path ? (
      <code className='bg-muted rounded px-1 py-0.5 text-xs'>{issue.path}</code>
    ) : null

  return (
    <div className='flex flex-col gap-3 lg:gap-6'>
      <div className='grid gap-3 lg:grid-cols-2 lg:gap-6'>
        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.import.target.title')}</CardTitle>
            <CardDescription>{t('manage.import.target.description')}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-5'>
            <Field className='gap-2'>
              <FieldLabel htmlFor='import-course'>{t('manage.import.target.courseLabel')}</FieldLabel>
              <Select
                value={courseId === null ? null : String(courseId)}
                onValueChange={value => setCourseId(value ? Number(value) : null)}
              >
                <SelectTrigger id='import-course' className='w-full'>
                  <SelectValue>
                    {(value: string | null) => {
                      const selected = courses.find(item => String(item.id) === value)

                      return selected ? (
                        <span className='truncate'>{selected.title}</span>
                      ) : (
                        <span className='text-muted-foreground'>{t('manage.import.target.coursePlaceholder')}</span>
                      )
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className='max-h-100'>
                  {courses.map(item => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      <span className='truncate'>{item.title}</span>
                      <span className='text-muted-foreground text-xs'>
                        {item.category.code} · {t('manage.import.target.moduleCount', { count: item.moduleCount })}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {course && !course.isPublic ? (
                <FieldDescription>{t('manage.import.target.draftCourseHint')}</FieldDescription>
              ) : null}
            </Field>

            <Field orientation='horizontal'>
              <Checkbox
                id='import-skip-duplicates'
                checked={skipDuplicates}
                onCheckedChange={checked => setSkipDuplicates(checked === true)}
              />
              <FieldContent>
                <FieldLabel htmlFor='import-skip-duplicates'>{t('manage.import.target.skipDuplicates')}</FieldLabel>
                <FieldDescription>{t('manage.import.target.skipDuplicatesHint')}</FieldDescription>
              </FieldContent>
            </Field>
          </CardContent>
        </Card>

        <Card
          className={cn('shadow-none transition-colors', dragging && 'border-primary bg-primary/5')}
          onDragOver={event => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.import.file.title')}</CardTitle>
            <CardDescription>{t('manage.import.file.description', { max: MAX_IMPORT_MEGABYTES })}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            <input
              ref={inputRef}
              type='file'
              accept='.csv,.json,text/csv,application/json'
              className='hidden'
              onChange={handleSelect}
            />
            <div className='flex flex-wrap items-center gap-2'>
              <Button type='button' onClick={() => inputRef.current?.click()}>
                <UploadCloudIcon className='size-4' />
                {t('manage.import.file.choose')}
              </Button>
              {file ? (
                <span className='bg-muted flex min-w-0 items-center gap-2 rounded-md py-1 pr-1 pl-2.5 text-sm'>
                  <FileUpIcon className='text-muted-foreground size-4 shrink-0' />
                  <span className='truncate'>{file.name}</span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    aria-label={t('manage.import.file.clear')}
                    onClick={clearFile}
                  >
                    <XIcon className='size-3.5' />
                  </Button>
                </span>
              ) : (
                <span className='text-muted-foreground text-sm'>{t('manage.import.file.dropHint')}</span>
              )}
            </div>

            <div className='text-muted-foreground flex flex-col gap-1.5 text-sm'>
              <p>{t('manage.import.file.csvHint')}</p>
              <p>{t('manage.import.file.jsonHint')}</p>
            </div>

            <div className='flex flex-wrap gap-2'>
              <Button type='button' variant='outline' size='sm' onClick={() => downloadTemplate('csv')}>
                <DownloadIcon className='size-4' />
                {t('manage.import.file.csvTemplate')}
              </Button>
              <Button type='button' variant='outline' size='sm' onClick={() => downloadTemplate('json')}>
                <DownloadIcon className='size-4' />
                {t('manage.import.file.jsonTemplate')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {completed ? (
        <Alert>
          <CircleCheckIcon />
          <AlertTitle>{t('manage.import.done.title', { title: completed.course.title })}</AlertTitle>
          <AlertDescription className='flex flex-wrap items-center justify-between gap-3'>
            <span>{t('manage.import.done.description', { ...completed.result })}</span>
            <Button
              render={<Link href={`/manage/courses/${completed.course.id}`} />}
              nativeButton={false}
              variant='outline'
              size='sm'
            >
              {t('manage.import.done.openCourse')}
              <ArrowRightIcon className='size-4' />
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {draft ? (
        <>
          <StatCards
            items={[
              {
                icon: <LayersIcon className='size-4' />,
                label: t('manage.import.stats.modules'),
                value: rows.length,
                hint: course
                  ? t('manage.import.stats.modulesHint', {
                      created: rows.length - existingCount,
                      existing: existingCount
                    })
                  : undefined
              },
              {
                icon: <LayoutGridIcon className='size-4' />,
                label: t('manage.import.stats.cards'),
                value: cardCount
              },
              {
                icon: <CircleAlertIcon className='size-4' />,
                label: t('manage.import.stats.errors'),
                value: errorCount,
                hint: errorCount > 0 ? t('manage.import.stats.errorsHint') : undefined
              },
              {
                icon: <TriangleAlertIcon className='size-4' />,
                label: t('manage.import.stats.warnings'),
                value: warningCount
              }
            ]}
          />

          {issues.length > 0 ? (
            <Alert variant={errorCount > 0 ? 'destructive' : 'default'}>
              {errorCount > 0 ? <CircleAlertIcon /> : <TriangleAlertIcon />}
              <AlertTitle>
                {errorCount > 0
                  ? t('manage.import.issues.errorsTitle', { count: errorCount })
                  : t('manage.import.issues.warningsTitle', { count: warningCount })}
              </AlertTitle>
              <AlertDescription>
                <ul className='flex max-h-64 w-full flex-col gap-1 overflow-y-auto'>
                  {issues.map((issue, index) => (
                    <li key={index} className='flex flex-wrap items-baseline gap-x-2'>
                      <Badge
                        variant={issue.severity === 'error' ? 'destructive' : 'outline'}
                        className='text-[11px] uppercase'
                      >
                        {issue.severity === 'error'
                          ? t('manage.import.issues.error')
                          : t('manage.import.issues.warning')}
                      </Badge>
                      {describeLocation(issue)}
                      <span>{t(issue.key, issue.values)}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
        </>
      ) : null}

      <Card className='py-0 shadow-none'>
        <CardHeader className='border-b py-4'>
          <CardTitle className='text-base'>{t('manage.import.preview.title')}</CardTitle>
          <CardDescription>
            {!draft
              ? t('manage.import.preview.noFile')
              : !course
                ? t('manage.import.preview.noCourse')
                : errorCount > 0
                  ? t('manage.import.preview.blocked')
                  : t('manage.import.preview.ready', { cards: cardCount, title: course.title })}
          </CardDescription>
          <CardAction>
            <Button type='button' disabled={!canImport} onClick={handleImport}>
              <FileUpIcon className='size-4' />
              {t('manage.import.preview.import')}
            </Button>
          </CardAction>
        </CardHeader>

        <DataTable<PreviewRow, string>
          rows={rows}
          columns={columns}
          sorting={null}
          onSortingChange={() => {}}
          getRowId={row => String(row.index)}
          emptyMessage={draft ? t('manage.import.preview.empty') : t('manage.import.preview.noFile')}
        />
      </Card>
    </div>
  )
}
