'use client'

import type { ColumnDef, SortingState, Updater } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronUpIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Sorting } from '@/hooks/wordzen/use-table-controls'
import { cn } from '@/lib/utils'

export interface DataTableProps<TRow, TColumn extends string> {
  rows: TRow[]
  columns: ColumnDef<TRow>[]
  sorting: Sorting<TColumn> | null
  onSortingChange: (sorting: Sorting<TColumn> | null) => void
  getRowId: (row: TRow) => string
  emptyMessage?: string
}

/**
 * Sortable table over an already-filtered, already-paginated page of rows.
 *
 * Filtering, sorting and pagination all happen in the owning hook against the full set,
 * so every TanStack model is set to manual — otherwise it would re-sort the current page
 * in isolation and rows would shuffle between pages.
 */
export function DataTable<TRow, TColumn extends string>({
  rows,
  columns,
  sorting,
  onSortingChange,
  getRowId,
  emptyMessage = 'Nothing to show.'
}: DataTableProps<TRow, TColumn>) {
  const sortingState: SortingState = sorting ? [sorting] : []

  const handleSortingChange = (updater: Updater<SortingState>) => {
    const next = typeof updater === 'function' ? updater(sortingState) : updater

    if (next.length === 0) {
      onSortingChange(null)

      return
    }

    onSortingChange({ id: next[0].id as TColumn, desc: next[0].desc })
  }

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    enableRowSelection: false,
    enableSortingRemoval: false,
    state: { sorting: sortingState },
    onSortingChange: handleSortingChange
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id} className='h-12 border-t'>
            {headerGroup.headers.map(header => {
              const canSort = header.column.getCanSort()
              const sortDirection = header.column.getIsSorted()

              return (
                <TableHead
                  key={header.id}
                  style={header.getSize() ? { width: `${header.getSize()}px` } : undefined}
                  className='text-muted-foreground first:pl-4 last:pr-4'
                >
                  {header.isPlaceholder ? null : canSort ? (
                    <button
                      type='button'
                      className='flex h-full cursor-pointer items-center gap-1.5 select-none'
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortDirection === 'asc' ? (
                        <ChevronUpIcon className='size-3.5' />
                      ) : sortDirection === 'desc' ? (
                        <ChevronDownIcon className='size-3.5' />
                      ) : (
                        <ChevronsUpDownIcon className='size-3.5 opacity-50' />
                      )}
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow className='hover:bg-transparent'>
            <TableCell colSpan={columns.length} className='text-muted-foreground h-28 text-center'>
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map(row => (
            <TableRow key={row.id} className={cn('border-t')}>
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id} className='first:pl-4 last:pr-4'>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
