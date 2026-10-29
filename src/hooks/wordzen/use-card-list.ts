'use client'

import { useCallback, useMemo, useState } from 'react'

import type { Card, CardPayload, LocaleCode, ModulePayload, PhraseCardPayload } from '@/types/wordzen/content-types'

import { mockStore, useStoreSelector } from './use-mock-store'
import { applySorting, matchesSearch, usePaginatedRows, useTableControls } from './use-table-controls'

export type CardSortColumn = 'order' | 'term' | 'translations' | 'samples' | 'created'

export type CardLocaleFilter = LocaleCode | 'all'

export type CardImageFilter = 'all' | 'with' | 'without'

const compareCards = (a: Card, b: Card, column: CardSortColumn): number => {
  switch (column) {
    case 'term':
      return a.term.localeCompare(b.term)
    case 'translations':
      return a.translations.length - b.translations.length
    case 'samples':
      return a.samples.length - b.samples.length
    case 'created':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    default:
      return a.displayOrder - b.displayOrder
  }
}

/**
 * The cards and phrase cards of one module — `GET /api/v1/manager/modules/{moduleId}/cards`
 * and `/phrase-cards`.
 */
export function useCardList(moduleId: number) {
  const controls = useTableControls<CardSortColumn>({ id: 'order', desc: false })
  const [locale, setLocaleState] = useState<CardLocaleFilter>('all')
  const [image, setImageState] = useState<CardImageFilter>('all')

  const currentModule = useStoreSelector(() => mockStore.getModule(moduleId), [moduleId])
  const course = useMemo(() => (currentModule ? mockStore.getCourse(currentModule.courseId) : null), [currentModule])
  const allCards = useStoreSelector(() => mockStore.listCards(moduleId), [moduleId])
  const phraseCards = useStoreSelector(() => mockStore.listPhraseCards(moduleId), [moduleId])

  const filtered = useMemo(
    () =>
      allCards.filter(card => {
        if (locale !== 'all' && !card.translations.some(translation => translation.locale === locale)) {
          return false
        }

        if (image === 'with' && !card.image) {
          return false
        }

        if (image === 'without' && card.image) {
          return false
        }

        // Searching a card means searching what it teaches, so the glosses count too.
        return matchesSearch(controls.search, card.term, ...card.translations.map(translation => translation.value))
      }),
    [allCards, controls.search, image, locale]
  )

  const sorted = useMemo(() => applySorting(filtered, controls.sorting, compareCards), [controls.sorting, filtered])

  const pagination = usePaginatedRows(sorted, controls.page, controls.rowsPerPage)

  const setLocale = useCallback(
    (value: CardLocaleFilter) => {
      setLocaleState(value)
      controls.resetPage()
    },
    [controls]
  )

  const setImage = useCallback(
    (value: CardImageFilter) => {
      setImageState(value)
      controls.resetPage()
    },
    [controls]
  )

  const totals = useMemo(
    () => ({
      cardCount: allCards.length,
      withImageCount: allCards.filter(card => card.image).length,
      sampleCount: allCards.reduce((total, card) => total + card.samples.length, 0),
      phraseCardCount: phraseCards.length
    }),
    [allCards, phraseCards]
  )

  return {
    ...controls,
    currentModule,
    course,
    locale,
    setLocale,
    image,
    setImage,
    totals,
    phraseCards,
    cards: pagination.pageItems,
    ...pagination,

    /** The currentModule's own fields, edited from its detail header. */
    updateModule: useCallback(
      (targetModuleId: number, payload: ModulePayload) => mockStore.updateModule(targetModuleId, payload),
      []
    ),
    createCard: useCallback((payload: CardPayload) => mockStore.createCard(payload), []),
    updateCard: useCallback((cardId: number, payload: CardPayload) => mockStore.updateCard(cardId, payload), []),
    deleteCard: useCallback((cardId: number) => mockStore.deleteCard(cardId), []),
    clearCardImage: useCallback((cardId: number) => mockStore.deleteCardImage(cardId), []),
    moveCard: useCallback(
      (card: Card, direction: -1 | 1) => mockStore.reorderCard(card.id, card.displayOrder + direction),
      []
    ),
    createPhraseCard: useCallback((payload: PhraseCardPayload) => mockStore.createPhraseCard(payload), []),
    updatePhraseCard: useCallback(
      (phraseCardId: number, payload: PhraseCardPayload) => mockStore.updatePhraseCard(phraseCardId, payload),
      []
    ),
    deletePhraseCard: useCallback((phraseCardId: number) => mockStore.deletePhraseCard(phraseCardId), [])
  }
}
