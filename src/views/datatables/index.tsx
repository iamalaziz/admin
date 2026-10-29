'use client'

// Component Imports
import DataTableBasic from '@/views/datatables/basic'
import DataTableWithFilters from '@/views/datatables/filters'
import DataTablePinnableColumn from '@/views/datatables/pinnable-columns'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const DataTable = () => {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-8'>
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>{t('datatable.sections.basic')}</h2>
        <DataTableBasic />
      </div>
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>{t('datatable.sections.pinnable')}</h2>
        <DataTablePinnableColumn />
      </div>
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>{t('datatable.sections.withFilters')}</h2>
        <DataTableWithFilters />
      </div>
    </div>
  )
}

export default DataTable
