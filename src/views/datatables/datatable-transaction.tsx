'use client'

import { useMemo, useState } from 'react'

import type { ColumnDef, PaginationState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import { ChevronLeftIcon, ChevronRightIcon, EllipsisVerticalIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { usePagination } from '@/hooks/use-pagination'
import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

export type Item = {
  id: string
  avatar: string
  avatarFallback: string
  name: string
  email: string
  amount: number
  status: 'pending' | 'processing' | 'paid' | 'failed'
  paidBy: 'mastercard' | 'visa'
}

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string

// A factory rather than a constant: the header labels have to be re-read when the language changes.
export const getColumns = (t: Translate): ColumnDef<Item>[] => [
  {
    accessorKey: 'name',
    header: t('datatable.columns.customer'),
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <Avatar className='size-9'>
          <AvatarImage src={row.original.avatar} alt={row.original.name} />
          <AvatarFallback className='text-xs'>{row.original.avatarFallback}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col text-sm'>
          <span className='text-card-foreground font-medium'>{row.getValue('name')}</span>
          <span className='text-muted-foreground'>{row.original.email}</span>
        </div>
      </div>
    )
  },
  {
    accessorKey: 'amount',
    header: t('datatable.columns.amount'),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'))

      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount)

      return <span>{formatted}</span>
    }
  },
  {
    accessorKey: 'status',
    header: t('datatable.columns.status'),
    cell: ({ row }) => (
      <Badge className='bg-primary/10 text-primary h-auto rounded-sm px-1.5'>
        {t(`datatable.paymentStatus.${row.getValue('status') as Item['status']}`)}
      </Badge>
    )
  },
  {
    accessorKey: 'paidBy',
    header: () => <span className='w-fit'>{t('datatable.columns.paidBy')}</span>,
    cell: ({ row }) => (
      <img
        src={
          row.getValue('paidBy') === 'mastercard' ? '/images/datatable/image-1.webp' : '/images/datatable/image-2.webp'
        }
        alt={t('datatable.paymentPlatformAlt')}
        className='w-10.5'
      />
    )
  },
  {
    id: 'actions',
    header: () => t('common.actions'),
    cell: () => <RowActions />,
    size: 60,
    enableHiding: false
  }
]

const TransactionDatatable = ({ data }: { data: Item[] }) => {
  const { t } = useTranslation()
  const pageSize = 5

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize
  })

  const columns = useMemo(() => getColumns(t), [t])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination
    }
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 2
  })

  const showingFrom = table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1

  const showingTo = Math.min(
    Math.max(
      table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
        table.getState().pagination.pageSize,
      0
    ),
    table.getRowCount()
  )

  return (
    <div className='w-full'>
      <div className='border-b'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id} className='text-muted-foreground h-14 first:pl-4'>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className='first:pl-4'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  {t('common.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between gap-3 px-6 py-4 max-sm:flex-col md:max-lg:flex-col'>
        <p className='text-muted-foreground text-sm whitespace-nowrap' aria-live='polite'>
          {t('datatable.showingEntries', {
            from: showingFrom,
            to: showingTo,
            total: table.getRowCount()
          })}
        </p>

        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  className='disabled:pointer-events-none disabled:opacity-50'
                  variant='ghost'
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label={t('common.goToPreviousPage')}
                >
                  <ChevronLeftIcon aria-hidden='true' />
                  {t('common.previous')}
                </Button>
              </PaginationItem>

              {showLeftEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {pages.map(page => {
                const isActive = page === table.getState().pagination.pageIndex + 1

                return (
                  <PaginationItem key={page}>
                    <Button
                      size='icon'
                      className={`${!isActive && 'bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40'}`}
                      onClick={() => table.setPageIndex(page - 1)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                )
              })}

              {showRightEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <Button
                  className='disabled:pointer-events-none disabled:opacity-50'
                  variant='ghost'
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label={t('common.goToNextPage')}
                >
                  {t('common.next')}
                  <ChevronRightIcon aria-hidden='true' />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}

export default TransactionDatatable

function RowActions() {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size='icon' variant='ghost' aria-label={t('datatable.editItem')} />}>
        <EllipsisVerticalIcon className='size-5' aria-hidden='true' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <span>{t('common.edit')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>{t('datatable.duplicate')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem variant='destructive'>
            <span>{t('common.delete')}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
