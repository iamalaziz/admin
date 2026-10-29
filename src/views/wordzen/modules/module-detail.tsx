'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import type { ColumnDef } from '@tanstack/react-table'
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ImageIcon,
  ImageOffIcon,
  LayoutGridIcon,
  MessageSquareQuoteIcon,
  PencilIcon,
  PlusIcon,
  QuoteIcon,
  Trash2Icon
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card as UiCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CardSortColumn } from '@/hooks/wordzen/use-card-list'
import { useCardList } from '@/hooks/wordzen/use-card-list'
import { useTranslation } from '@/lib/i18n'
import type { Card, CardPayload, ModulePayload, PhraseCard, PhraseCardPayload } from '@/types/wordzen/content-types'
import { LOCALE_CODES } from '@/types/wordzen/content-types'

import { CardFormSheet } from '../cards/card-form-sheet'
import { PhraseCardFormSheet } from '../cards/phrase-card-form-sheet'
import { DataTable } from '../shared/data-table'
import {
  ConfirmDialog,
  DetailRow,
  FilePathCell,
  LocaleBadge,
  PublishedBadge,
  StatCards,
  Timestamp
} from '../shared/primitives'
import { TablePagination, TableToolbar } from '../shared/table-chrome'
import { ModuleFormSheet } from './module-form-sheet'

export function ModuleDetail({ moduleId }: { moduleId: number }) {
  const { t } = useTranslation()
  const list = useCardList(moduleId)

  const [moduleFormOpen, setModuleFormOpen] = useState(false)
  const [cardFormOpen, setCardFormOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [pendingCardDelete, setPendingCardDelete] = useState<Card | null>(null)
  const [phraseFormOpen, setPhraseFormOpen] = useState(false)
  const [editingPhrase, setEditingPhrase] = useState<PhraseCard | null>(null)
  const [pendingPhraseDelete, setPendingPhraseDelete] = useState<PhraseCard | null>(null)

  const currentModule = list.currentModule
  const course = list.course

  const columns = useMemo<ColumnDef<Card>[]>(
    () => [
      {
        id: 'term',
        header: t('manage.columns.term'),
        cell: ({ row }) => (
          <div className='flex min-w-0 flex-col'>
            <span className='truncate font-medium'>{row.original.term}</span>
            <span className='text-muted-foreground text-xs'>#{row.original.displayOrder}</span>
          </div>
        )
      },
      {
        id: 'translations',
        header: t('manage.columns.translations'),
        cell: ({ row }) => (
          <div className='flex flex-col gap-1'>
            {row.original.translations.map(translation => (
              <div key={translation.id} className='flex items-center gap-1.5'>
                <LocaleBadge locale={translation.locale} />
                <span className='max-w-56 truncate text-sm'>{translation.value}</span>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'samples',
        header: t('manage.columns.samples'),
        cell: ({ row }) => <span className='text-sm'>{row.original.samples.length}</span>
      },
      {
        id: 'image',
        header: t('manage.columns.image'),
        enableSorting: false,
        cell: ({ row }) => <FilePathCell path={row.original.image} />
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
              aria-label={t('manage.rowActions.moveUp', { name: row.original.term })}
              disabled={row.original.displayOrder <= 1}
              onClick={() => list.moveCard(row.original, -1)}
            >
              <ChevronUpIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.moveDown', { name: row.original.term })}
              disabled={row.original.displayOrder >= list.totals.cardCount}
              onClick={() => list.moveCard(row.original, 1)}
            >
              <ChevronDownIcon className='size-4' />
            </Button>
            {row.original.image ? (
              <Button
                variant='ghost'
                size='icon'
                aria-label={t('manage.rowActions.removeImage', { name: row.original.term })}
                onClick={() => {
                  list.clearCardImage(row.original.id)
                  toast.success(t('manage.moduleDetail.toast.imageRemoved', { term: row.original.term }))
                }}
              >
                <ImageOffIcon className='size-4' />
              </Button>
            ) : null}
            <Button
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.edit', { name: row.original.term })}
              onClick={() => {
                setEditingCard(row.original)
                setCardFormOpen(true)
              }}
            >
              <PencilIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.delete', { name: row.original.term })}
              className='text-muted-foreground hover:text-destructive'
              onClick={() => setPendingCardDelete(row.original)}
            >
              <Trash2Icon className='size-4' />
            </Button>
          </div>
        )
      }
    ],
    [list, t]
  )

  if (!currentModule || !course) {
    return (
      <UiCard className='shadow-none'>
        <CardContent className='flex flex-col items-start gap-3 py-10'>
          <p className='font-medium'>{t('manage.moduleDetail.notFound', { id: moduleId })}</p>
          <p className='text-muted-foreground text-sm'>{t('manage.moduleDetail.notFoundHint')}</p>
          <Button render={<Link href='/manage/courses' />} nativeButton={false} variant='outline'>
            <ArrowLeftIcon className='size-4' />
            {t('manage.moduleDetail.backToCourses')}
          </Button>
        </CardContent>
      </UiCard>
    )
  }

  const handleModuleSubmit = (payload: ModulePayload) => {
    list.updateModule(currentModule.id, payload)
    toast.success(t('manage.moduleDetail.toast.moduleUpdated', { title: payload.title }))
  }

  const handleCardSubmit = (payload: CardPayload) => {
    if (editingCard) {
      list.updateCard(editingCard.id, payload)
      toast.success(t('manage.moduleDetail.toast.cardUpdated', { term: payload.term }))

      return
    }

    list.createCard(payload)
    toast.success(t('manage.moduleDetail.toast.cardCreated', { term: payload.term }))
  }

  const handlePhraseSubmit = (payload: PhraseCardPayload) => {
    if (editingPhrase) {
      list.updatePhraseCard(editingPhrase.id, payload)
      toast.success(t('manage.moduleDetail.toast.phraseUpdated'))

      return
    }

    list.createPhraseCard(payload)
    toast.success(t('manage.moduleDetail.toast.phraseCreated'))
  }

  return (
    <div className='flex flex-col gap-3 lg:gap-6'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-col gap-1'>
          <Button
            render={<Link href={`/manage/courses/${course.id}`} />}
            nativeButton={false}
            variant='ghost'
            size='sm'
            className='-ml-2 w-fit'
          >
            <ArrowLeftIcon className='size-4' />
            {course.title}
          </Button>
          <h1 className='truncate text-2xl font-semibold'>{currentModule.title}</h1>
          <div className='flex flex-wrap items-center gap-2'>
            <PublishedBadge isPublic={currentModule.isPublic} />
            <span className='text-muted-foreground text-sm'>
              {t('manage.moduleDetail.order', { order: currentModule.displayOrder })}
            </span>
          </div>
        </div>
        <Button variant='outline' onClick={() => setModuleFormOpen(true)}>
          <PencilIcon className='size-4' />
          {t('manage.moduleDetail.editModule')}
        </Button>
      </div>

      <StatCards
        items={[
          {
            icon: <LayoutGridIcon className='size-4' />,
            label: t('manage.moduleDetail.stats.cards'),
            value: list.totals.cardCount
          },
          {
            icon: <ImageIcon className='size-4' />,
            label: t('manage.moduleDetail.stats.withImage'),
            value: list.totals.withImageCount
          },
          {
            icon: <QuoteIcon className='size-4' />,
            label: t('manage.moduleDetail.stats.samples'),
            value: list.totals.sampleCount,
            hint: t('manage.moduleDetail.stats.samplesHint')
          },
          {
            icon: <MessageSquareQuoteIcon className='size-4' />,
            label: t('manage.moduleDetail.stats.phraseCards'),
            value: list.totals.phraseCardCount
          }
        ]}
      />

      <UiCard className='shadow-none'>
        <CardHeader>
          <CardTitle className='text-base'>{t('manage.moduleDetail.infoTitle')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-x-8 sm:grid-cols-2'>
          <DetailRow label={t('manage.moduleDetail.fields.id')}>{currentModule.id}</DetailRow>
          <DetailRow label={t('manage.moduleDetail.fields.course')}>{course.title}</DetailRow>
          <DetailRow label={t('manage.moduleDetail.fields.created')}>
            <Timestamp value={currentModule.createdAt} withTime />
          </DetailRow>
          <DetailRow label={t('manage.moduleDetail.fields.courseAccess')}>{course.accessCode}</DetailRow>
        </CardContent>
      </UiCard>

      <Tabs defaultValue='cards'>
        <TabsList>
          <TabsTrigger value='cards'>
            {t('manage.moduleDetail.tabs.cards', { count: list.totals.cardCount })}
          </TabsTrigger>
          <TabsTrigger value='phrases'>
            {t('manage.moduleDetail.tabs.phrases', { count: list.totals.phraseCardCount })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='cards'>
          <UiCard className='py-0 shadow-none'>
            <div className='w-full'>
              <TableToolbar
                search={list.search}
                onSearchChange={list.setSearch}
                searchPlaceholder={t('manage.moduleDetail.searchPlaceholder')}
                rowsPerPage={list.rowsPerPage}
                onRowsPerPageChange={list.setRowsPerPage}
                filters={
                  <>
                    <Select value={list.locale} onValueChange={value => list.setLocale(value as typeof list.locale)}>
                      <SelectTrigger className='w-32' aria-label={t('manage.filters.locale')}>
                        <SelectValue placeholder={t('manage.filters.localePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>{t('manage.filters.allLocales')}</SelectItem>
                        {LOCALE_CODES.map(locale => (
                          <SelectItem key={locale} value={locale}>
                            {locale}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={list.image} onValueChange={value => list.setImage(value as typeof list.image)}>
                      <SelectTrigger className='w-36' aria-label={t('manage.filters.image')}>
                        <SelectValue placeholder={t('manage.filters.imagePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>{t('manage.filters.anyImage')}</SelectItem>
                        <SelectItem value='with'>{t('manage.filters.withImage')}</SelectItem>
                        <SelectItem value='without'>{t('manage.filters.withoutImage')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                }
                actions={
                  <Button
                    onClick={() => {
                      setEditingCard(null)
                      setCardFormOpen(true)
                    }}
                  >
                    <PlusIcon className='size-4' />
                    {t('manage.moduleDetail.newCard')}
                  </Button>
                }
              />

              <DataTable<Card, CardSortColumn>
                rows={list.cards}
                columns={columns}
                sorting={list.sorting}
                onSortingChange={list.setSorting}
                getRowId={card => String(card.id)}
                emptyMessage={t('manage.moduleDetail.empty')}
              />

              <TablePagination
                showingFrom={list.showingFrom}
                showingTo={list.showingTo}
                total={list.total}
                page={list.page}
                totalPages={list.totalPages}
                onPageChange={list.setPage}
                noun={t('manage.nouns.cards')}
              />
            </div>
          </UiCard>
        </TabsContent>

        <TabsContent value='phrases'>
          <UiCard className='shadow-none'>
            <CardHeader className='flex flex-row items-center justify-between gap-3'>
              <CardTitle className='text-base'>{t('manage.moduleDetail.phrases.title')}</CardTitle>
              <Button
                size='sm'
                onClick={() => {
                  setEditingPhrase(null)
                  setPhraseFormOpen(true)
                }}
              >
                <PlusIcon className='size-4' />
                {t('manage.moduleDetail.phrases.new')}
              </Button>
            </CardHeader>
            <CardContent className='flex flex-col gap-3'>
              {list.phraseCards.length === 0 ? (
                <p className='text-muted-foreground text-sm'>{t('manage.moduleDetail.phrases.empty')}</p>
              ) : (
                list.phraseCards.map(phraseCard => (
                  <div key={phraseCard.id} className='flex items-start justify-between gap-3 rounded-md border p-3'>
                    <div className='flex min-w-0 flex-col gap-2'>
                      <span className='font-medium'>
                        #{phraseCard.displayOrder} {phraseCard.text}
                      </span>
                      {phraseCard.explanations.map(explanation => (
                        <div key={explanation.id} className='flex items-start gap-2'>
                          <LocaleBadge locale={explanation.locale} />
                          <span className='text-muted-foreground text-sm'>{explanation.text}</span>
                        </div>
                      ))}
                    </div>
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        aria-label={t('manage.rowActions.edit', { name: phraseCard.text })}
                        onClick={() => {
                          setEditingPhrase(phraseCard)
                          setPhraseFormOpen(true)
                        }}
                      >
                        <PencilIcon className='size-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        aria-label={t('manage.rowActions.delete', { name: phraseCard.text })}
                        className='text-muted-foreground hover:text-destructive'
                        onClick={() => setPendingPhraseDelete(phraseCard)}
                      >
                        <Trash2Icon className='size-4' />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </UiCard>
        </TabsContent>
      </Tabs>

      <ModuleFormSheet
        open={moduleFormOpen}
        module={currentModule}
        course={course}
        onOpenChange={setModuleFormOpen}
        onSubmit={handleModuleSubmit}
      />

      <CardFormSheet
        open={cardFormOpen}
        card={editingCard}
        module={currentModule}
        onOpenChange={setCardFormOpen}
        onSubmit={handleCardSubmit}
      />

      <PhraseCardFormSheet
        open={phraseFormOpen}
        phraseCard={editingPhrase}
        module={currentModule}
        onOpenChange={setPhraseFormOpen}
        onSubmit={handlePhraseSubmit}
      />

      <ConfirmDialog
        open={pendingCardDelete !== null}
        onOpenChange={open => !open && setPendingCardDelete(null)}
        title={t('manage.moduleDetail.cardDelete.title')}
        description={
          pendingCardDelete ? (
            <>
              <strong>{pendingCardDelete.term}</strong> {t('manage.moduleDetail.cardDelete.description')}
            </>
          ) : null
        }
        onConfirm={() => {
          if (!pendingCardDelete) {
            return
          }

          list.deleteCard(pendingCardDelete.id)
          toast.success(t('manage.moduleDetail.toast.cardDeleted', { term: pendingCardDelete.term }))
        }}
      />

      <ConfirmDialog
        open={pendingPhraseDelete !== null}
        onOpenChange={open => !open && setPendingPhraseDelete(null)}
        title={t('manage.moduleDetail.phraseDelete.title')}
        description={
          pendingPhraseDelete ? (
            <>
              <strong>{pendingPhraseDelete.text}</strong> {t('manage.moduleDetail.phraseDelete.description')}
            </>
          ) : null
        }
        onConfirm={() => {
          if (!pendingPhraseDelete) {
            return
          }

          list.deletePhraseCard(pendingPhraseDelete.id)
          toast.success(t('manage.moduleDetail.toast.phraseDeleted'))
        }}
      />
    </div>
  )
}
