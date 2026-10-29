'use client'

import { useCallback, useMemo, useState } from 'react'

import { MOCK_REF_DATE } from '@/fake-db/wordzen/store'
import type { CurrencyCode, ProviderCode, PurchaseType, TransactionStatusCode } from '@/types/wordzen/payment-types'
import type { PaymentTransaction } from '@/types/wordzen/payment-types'
import { OPEN_TRANSACTION_STATUSES } from '@/types/wordzen/payment-types'

import { mockStore, useStoreSelector } from './use-mock-store'
import { applySorting, matchesSearch, usePaginatedRows, useTableControls } from './use-table-controls'

export type PaymentSortColumn = 'id' | 'created' | 'amount' | 'coins' | 'status' | 'provider' | 'user'

export type PaymentFilters = {
  provider: ProviderCode | 'all'
  status: TransactionStatusCode | 'all'
  purchaseType: PurchaseType | 'all'
}

const DEFAULT_FILTERS: PaymentFilters = {
  provider: 'all',
  status: 'all',
  purchaseType: 'all'
}

/**
 * Amounts are not comparable across currencies — 190 Telegram stars against 99,900 UZS —
 * and the store purchases carry no amount at all. Sorting by amount therefore groups by
 * currency first and orders within it, and the rows with no amount sort last either way.
 */
const compareAmounts = (a: PaymentTransaction, b: PaymentTransaction): number => {
  if (a.amount === null || b.amount === null) {
    return Number(a.amount === null) - Number(b.amount === null)
  }

  return (a.currency ?? '').localeCompare(b.currency ?? '') || a.amount - b.amount
}

const comparePayments = (a: PaymentTransaction, b: PaymentTransaction, column: PaymentSortColumn): number => {
  switch (column) {
    case 'created':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    case 'amount':
      return compareAmounts(a, b)
    case 'coins':
      return a.coins - b.coins
    case 'status':
      return a.status.localeCompare(b.status)
    case 'provider':
      return a.provider.localeCompare(b.provider)
    case 'user':
      return a.username.localeCompare(b.username)
    default:
      return a.id - b.id
  }
}

/**
 * The payments ledger: filter, search, sort and page over every transaction.
 *
 * Newest first by default, because that is the question the screen answers most often —
 * what has just come in, and what is stuck.
 */
export function usePaymentList() {
  const controls = useTableControls<PaymentSortColumn>({ id: 'created', desc: true })
  const [filters, setFiltersState] = useState<PaymentFilters>(DEFAULT_FILTERS)

  const allTransactions = useStoreSelector(() => mockStore.listTransactions())
  const stats = useStoreSelector(() => mockStore.getPaymentStats())

  const filtered = useMemo(
    () =>
      allTransactions.filter(transaction => {
        if (filters.provider !== 'all' && transaction.provider !== filters.provider) {
          return false
        }

        if (filters.status !== 'all' && transaction.status !== filters.status) {
          return false
        }

        if (filters.purchaseType !== 'all' && transaction.purchaseType !== filters.purchaseType) {
          return false
        }

        // Support arrives with whatever the payer or the provider quoted, which is as
        // often an invoice id or a charge id as it is our own uid — so the provider's
        // identifiers are searchable too.
        return matchesSearch(
          controls.search,
          transaction.uid,
          transaction.userUid,
          transaction.username,
          transaction.email,
          transaction.packageId,
          transaction.idempotencyKey,
          ...transaction.providerRefs.map(ref => ref.value)
        )
      }),
    [allTransactions, controls.search, filters]
  )

  const sorted = useMemo(() => applySorting(filtered, controls.sorting, comparePayments), [controls.sorting, filtered])

  const pagination = usePaginatedRows(sorted, controls.page, controls.rowsPerPage)

  const setFilters = useCallback(
    (next: Partial<PaymentFilters>) => {
      setFiltersState(prev => ({ ...prev, ...next }))
      controls.resetPage()
    },
    [controls]
  )

  return {
    ...controls,
    filters,
    setFilters,
    stats,
    transactions: pagination.pageItems,
    ...pagination
  }
}

/** How many months the payment history on a user page covers, counting the current one. */
const HISTORY_MONTHS = 12

/** One month of a payer's history. `amounts` is per currency, because currencies do not add up. */
export type PaymentMonth = {

  /** `YYYY-MM` in UTC — the React key and the sort order in one. */
  month: string
  payments: number
  succeeded: number
  coins: number
  amounts: Partial<Record<CurrencyCode, number>>
}

/**
 * A payer's months, newest first, with the empty ones kept.
 *
 * Twelve buckets measured back from `MOCK_REF_DATE` rather than `Date.now()`, like every
 * other date in the fixtures, so the server and the client agree on which month is which.
 * Months without a payment stay in the list: a gap is part of the history.
 */
export function useUserPayments(userUid: string) {
  const transactions = useStoreSelector(() => mockStore.listUserTransactions(userUid), [userUid])

  return useMemo(() => {
    const buckets = new Map<string, PaymentMonth>()

    for (let index = 0; index < HISTORY_MONTHS; index++) {
      const date = new Date(Date.UTC(MOCK_REF_DATE.getUTCFullYear(), MOCK_REF_DATE.getUTCMonth() - index, 1))
      const month = date.toISOString().slice(0, 7)

      buckets.set(month, { month, payments: 0, succeeded: 0, coins: 0, amounts: {} })
    }

    transactions.forEach(transaction => {
      const bucket = buckets.get(transaction.createdAt.slice(0, 7))

      if (!bucket) {
        return
      }

      bucket.payments += 1

      // Only a settled payment credited anything, so only those count towards the totals.
      if (transaction.status !== 'SUCCESS') {
        return
      }

      bucket.succeeded += 1
      bucket.coins += transaction.coins

      if (transaction.amount !== null && transaction.currency !== null) {
        bucket.amounts[transaction.currency] = (bucket.amounts[transaction.currency] ?? 0) + transaction.amount
      }
    })

    const months = [...buckets.values()].sort((a, b) => b.month.localeCompare(a.month))

    return {
      transactions,
      months,

      /** Scales the bars; zero when the payer has nothing in the window. */
      peakCoins: months.reduce((peak, month) => Math.max(peak, month.coins), 0),
      totals: {
        payments: transactions.length,
        succeeded: transactions.filter(transaction => transaction.status === 'SUCCESS').length,
        coins: transactions.reduce(
          (total, transaction) => total + (transaction.status === 'SUCCESS' ? transaction.coins : 0),
          0
        )
      }
    }
  }, [transactions])
}

/**
 * How long a checkout may stay open before it is worth looking at.
 *
 * Measured against `MOCK_REF_DATE` rather than `Date.now()`, like every other date in the
 * fixtures: the detail page renders on the server and hydrates on the client, and a
 * threshold crossed between the two passes would render differently in each.
 */
const STALE_AFTER_HOURS = 24

/** One payment, its status history and the subscription it opened, for the detail page. */
export function usePaymentDetail(uid: string) {
  const transaction = useStoreSelector(() => mockStore.getTransaction(uid), [uid])
  const history = useStoreSelector(() => mockStore.listTransactionHistory(uid), [uid])

  const subscriptionUid = transaction?.subscriptionUid ?? null

  const subscription = useStoreSelector(
    () => (subscriptionUid ? mockStore.getBillingSubscription(subscriptionUid) : null),
    [subscriptionUid ?? '']
  )

  /** The payer's other payments, so a chargeback can be read in context. */
  const userTransactions = useStoreSelector(
    () => (transaction ? mockStore.listUserTransactions(transaction.userUid) : []),
    [transaction?.userUid ?? '']
  )

  /** Still CREATED or PENDING a day on: nothing is coming, and someone should look. */
  const stalled =
    transaction !== null &&
    OPEN_TRANSACTION_STATUSES.includes(transaction.status) &&
    MOCK_REF_DATE.getTime() - new Date(transaction.createdAt).getTime() > STALE_AFTER_HOURS * 3_600_000

  return {
    transaction,
    history,
    subscription,
    userTransactions,
    stalled,
    cancelSubscription: useCallback(
      () => (subscriptionUid ? mockStore.cancelBillingSubscription(subscriptionUid) : null),
      [subscriptionUid]
    ),
    refundSubscription: useCallback(
      () => (subscriptionUid ? mockStore.refundBillingSubscription(subscriptionUid) : null),
      [subscriptionUid]
    )
  }
}
