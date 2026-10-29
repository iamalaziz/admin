'use client'

import type { ReactNode } from 'react'

import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePagination } from '@/hooks/use-pagination'
import { ROWS_PER_PAGE_OPTIONS } from '@/hooks/wordzen/use-table-controls'

export interface TableToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  rowsPerPage: number
  onRowsPerPageChange: (value: number) => void

  /** Filter controls, rendered between the search box and the actions. */
  filters?: ReactNode

  /** Primary actions, e.g. a "New course" button. */
  actions?: ReactNode
}

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search',
  rowsPerPage,
  onRowsPerPageChange,
  filters,
  actions
}: TableToolbarProps) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-3'>
      <div className='flex flex-wrap items-center gap-3'>
        <InputGroup className='w-full sm:w-64'>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </InputGroup>
        {filters}
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-sm whitespace-nowrap'>Rows</span>
          <Select value={String(rowsPerPage)} onValueChange={value => onRowsPerPageChange(Number(value))}>
            <SelectTrigger className='w-20' aria-label='Rows per page'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROWS_PER_PAGE_OPTIONS.map(option => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {actions}
      </div>
    </div>
  )
}

export interface TablePaginationProps {
  showingFrom: number
  showingTo: number
  total: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void

  /** What is being counted, for the "of 54 courses" label. */
  noun: string
}

export function TablePagination({
  showingFrom,
  showingTo,
  total,
  page,
  totalPages,
  onPageChange,
  noun
}: TablePaginationProps) {
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: page,
    totalPages,
    paginationItemsToDisplay: 3
  })

  return (
    <div className='flex items-center justify-between gap-3 px-4 py-3 max-sm:flex-col'>
      <p className='text-muted-foreground text-sm whitespace-nowrap' aria-live='polite'>
        Showing {showingFrom} to {showingTo} of {total} {noun}
      </p>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant='ghost'
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label='Go to previous page'
            >
              <ChevronLeftIcon aria-hidden='true' />
              <span className='max-sm:hidden'>Previous</span>
            </Button>
          </PaginationItem>

          {showLeftEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {pages.map(item => (
            <PaginationItem key={item}>
              <Button
                size='icon'
                variant={item === page ? 'default' : 'ghost'}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </Button>
            </PaginationItem>
          ))}

          {showRightEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          <PaginationItem>
            <Button
              variant='ghost'
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label='Go to next page'
            >
              <span className='max-sm:hidden'>Next</span>
              <ChevronRightIcon aria-hidden='true' />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
