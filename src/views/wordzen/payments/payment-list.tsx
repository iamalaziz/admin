'use client'

import { useMemo } from 'react'

import Link from 'next/link'

import type { ColumnDef } from '@tanstack/react-table'
import { BanknoteIcon, EyeIcon, HourglassIcon, ReceiptTextIcon, RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PaymentSortColumn } from '@/hooks/wordzen/use-payment-list'
import { usePaymentList } from '@/hooks/wordzen/use-payment-list'
import { useTranslation } from '@/lib/i18n'
import type { PaymentTransaction } from '@/types/wordzen/payment-types'
import {
  formatAmount,
  formatCoins,
  PROVIDER_CODES,
  PURCHASE_TYPES,
  shortUid,
  TRANSACTION_STATUS_CODES
} from '@/types/wordzen/payment-types'

import { formatPercent } from '../analytics/format'
import { DataTable } from '../shared/data-table'
import { AmountCell, ProviderBadge, StatCards, Timestamp, TransactionStatusBadge } from '../shared/primitives'
import { TablePagination, TableToolbar } from '../shared/table-chrome'

/** GOOGLE is in `ProviderCode` but nothing writes it, so it would be a filter with no rows. */
const FILTERABLE_PROVIDERS = PROVIDER_CODES.filter(provider => provider !== 'GOOGLE')

export function PaymentList() {
  const { t } = useTranslation()
  const list = usePaymentList()

  const columns = useMemo<ColumnDef<PaymentTransaction>[]>(
    () => [
      {
        id: 'id',
        header: t('manage.columns.transaction'),
        cell: ({ row }) => (
          <div className='flex min-w-0 flex-col'>
            <Link
              href={`/manage/payments/${row.original.uid}`}
              className='font-mono text-sm font-medium hover:underline'
              title={row.original.uid}
            >
              {shortUid(row.original.uid)}
            </Link>
            <span className='text-muted-foreground truncate text-xs'>
              {row.original.packageId ?? t(`manage.purchaseTypes.${row.original.purchaseType}`)}
            </span>
          </div>
        )
      },
      {
        id: 'user',
        header: t('manage.columns.user'),
        cell: ({ row }) => (
          <div className='flex min-w-0 flex-col'>
            <Link href={`/manage/users/${row.original.userUid}`} className='truncate font-medium hover:underline'>
              {row.original.username}
            </Link>
            <span className='text-muted-foreground truncate text-xs'>{row.original.email}</span>
          </div>
        )
      },
      {
        id: 'provider',
        header: t('manage.columns.provider'),
        cell: ({ row }) => <ProviderBadge provider={row.original.provider} card={row.original.card} />
      },
      {
        id: 'amount',
        header: t('manage.columns.amount'),
        cell: ({ row }) => (
          <div className='flex flex-col'>
            {row.original.amount !== null && row.original.currency !== null ? (
              <AmountCell amount={row.original.amount} currency={row.original.currency} />
            ) : (

              // Apple and Google Play report no price on a verify, so there is no amount
              // to show — only what the purchase was for.
              <span className='text-muted-foreground text-sm' title={t('manage.payments.noAmountHint')}>
                {t('manage.payments.noAmount')}
              </span>
            )}
            <span className='text-muted-foreground text-xs'>
              {row.original.coins > 0
                ? t('manage.payments.coinsCredited', { coins: formatCoins(row.original.coins) })
                : t(`manage.purchaseTypes.${row.original.purchaseType}`)}
            </span>
          </div>
        )
      },
      {
        id: 'status',
        header: t('manage.columns.status'),
        cell: ({ row }) => <TransactionStatusBadge status={row.original.status} />
      },
      {
        id: 'created',
        header: t('manage.columns.created'),
        cell: ({ row }) => (
          <span className='text-muted-foreground text-sm'>
            <Timestamp value={row.original.createdAt} withTime />
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
              render={<Link href={`/manage/payments/${row.original.uid}`} />}
              nativeButton={false}
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.open', { name: shortUid(row.original.uid) })}
            >
              <EyeIcon className='size-4' />
            </Button>
          </div>
        )
      }
    ],
    [t]
  )

  return (
    <div className='flex flex-col gap-3 lg:gap-6'>
      <StatCards
        items={[
          {
            icon: <ReceiptTextIcon className='size-4' />,
            label: t('manage.payments.stats.payments'),
            value: list.stats.transactionCount,
            hint: t('manage.payments.stats.successRate', { rate: formatPercent(list.stats.successRate, 0) })
          },
          {
            icon: <BanknoteIcon className='size-4' />,
            label: t('manage.payments.stats.collected'),
            value: list.stats.collectedUzs,
            format: amount => formatAmount(amount, 'UZS'),
            hint: t('manage.payments.stats.collectedHint')
          },
          {
            icon: <HourglassIcon className='size-4' />,
            label: t('manage.payments.stats.open'),
            value: list.stats.openCount,
            hint: t('manage.payments.stats.openHint')
          },
          {
            icon: <RefreshCwIcon className='size-4' />,
            label: t('manage.payments.stats.subscriptions'),
            value: list.stats.activeSubscriptionCount,
            hint: t('manage.payments.stats.subscriptionsHint', { count: list.stats.autoRenewCount })
          }
        ]}
      />

      <Card className='py-0 shadow-none'>
        <div className='w-full'>
          <TableToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder={t('manage.payments.searchPlaceholder')}
            rowsPerPage={list.rowsPerPage}
            onRowsPerPageChange={list.setRowsPerPage}
            filters={
              <>
                <Select
                  value={list.filters.provider}
                  onValueChange={value => list.setFilters({ provider: value as typeof list.filters.provider })}
                >
                  <SelectTrigger className='w-36' aria-label={t('manage.filters.provider')}>
                    <SelectValue placeholder={t('manage.filters.providerPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('manage.filters.allProviders')}</SelectItem>
                    {FILTERABLE_PROVIDERS.map(provider => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={list.filters.status}
                  onValueChange={value => list.setFilters({ status: value as typeof list.filters.status })}
                >
                  <SelectTrigger className='w-32' aria-label={t('manage.filters.status')}>
                    <SelectValue placeholder={t('manage.filters.statusPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('manage.filters.allStatuses')}</SelectItem>
                    {TRANSACTION_STATUS_CODES.map(status => (
                      <SelectItem key={status} value={status}>
                        {t(`manage.transactionStatuses.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={list.filters.purchaseType}
                  onValueChange={value => list.setFilters({ purchaseType: value as typeof list.filters.purchaseType })}
                >
                  <SelectTrigger className='w-40' aria-label={t('manage.filters.purchaseType')}>
                    <SelectValue placeholder={t('manage.filters.purchaseTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('manage.filters.allPurchaseTypes')}</SelectItem>
                    {PURCHASE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {t(`manage.purchaseTypes.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />

          <DataTable<PaymentTransaction, PaymentSortColumn>
            rows={list.transactions}
            columns={columns}
            sorting={list.sorting}
            onSortingChange={list.setSorting}
            getRowId={transaction => transaction.uid}
            emptyMessage={t('manage.payments.empty')}
          />

          <TablePagination
            showingFrom={list.showingFrom}
            showingTo={list.showingTo}
            total={list.total}
            page={list.page}
            totalPages={list.totalPages}
            onPageChange={list.setPage}
            noun={t('manage.nouns.payments')}
          />
        </div>
      </Card>
    </div>
  )
}
