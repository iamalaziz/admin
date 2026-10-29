// Component Imports
import { Card } from '@/components/ui/card'
import DataTableDemo, { type Payment } from '@/views/datatables/basic/basic-datatable'

const transactionData: Payment[] = [
  {
    id: '1',
    name: 'Jack Alfredo',
    amount: 316.0,
    status: 'paid',
    email: 'jack@local.test'
  },
  {
    id: '2',
    name: 'Maria Gonzalez',
    amount: 253.4,
    status: 'pending',
    email: 'maria.g@local.test'
  },
  {
    id: '3',
    name: 'John Doe',
    amount: 852.0,
    status: 'paid',
    email: 'john.doe@local.test'
  },
  {
    id: '4',
    name: 'Emily Carter',
    amount: 889.0,
    status: 'pending',
    email: 'emily.carter@local.test'
  },
  {
    id: '5',
    name: 'David Lee',
    amount: 723.16,
    status: 'paid',
    email: 'david.lee@local.test'
  },
  {
    id: '6',
    name: 'Sophia Patel',
    amount: 612.0,
    status: 'failed',
    email: 'sophia.patel@local.test'
  },
  {
    id: '7',
    name: 'Robert Wilson',
    amount: 445.25,
    status: 'paid',
    email: 'robert.wilson@local.test'
  },
  {
    id: '8',
    name: 'Lisa Martinez',
    amount: 297.8,
    status: 'processing',
    email: 'lisa.martinez@local.test'
  },
  {
    id: '9',
    name: 'Michael Thompson',
    amount: 756.9,
    status: 'paid',
    email: 'michael.thompson@local.test'
  },
  {
    id: '10',
    name: 'Amanda Johnson',
    amount: 189.5,
    status: 'pending',
    email: 'amanda.johnson@local.test'
  },
  {
    id: '11',
    name: 'Kevin Brown',
    amount: 1024.75,
    status: 'paid',
    email: 'kevin.brown@local.test'
  },
  {
    id: '12',
    name: 'Sarah Davis',
    amount: 367.2,
    status: 'failed',
    email: 'sarah.davis@local.test'
  },
  {
    id: '13',
    name: 'Christopher Garcia',
    amount: 598.45,
    status: 'processing',
    email: 'christopher.garcia@local.test'
  },
  {
    id: '14',
    name: 'Jennifer Rodriguez',
    amount: 821.3,
    status: 'paid',
    email: 'jennifer.rodriguez@local.test'
  },
  {
    id: '15',
    name: 'Daniel Miller',
    amount: 156.75,
    status: 'pending',
    email: 'daniel.miller@local.test'
  },
  {
    id: '16',
    name: 'Nicole White',
    amount: 934.1,
    status: 'paid',
    email: 'nicole.white@local.test'
  },
  {
    id: '17',
    name: 'Anthony Lopez',
    amount: 412.85,
    status: 'failed',
    email: 'anthony.lopez@local.test'
  },
  {
    id: '18',
    name: 'Michelle Harris',
    amount: 675.5,
    status: 'processing',
    email: 'michelle.harris@local.test'
  },
  {
    id: '19',
    name: 'James Clark',
    amount: 289.95,
    status: 'paid',
    email: 'james.clark@local.test'
  },
  {
    id: '20',
    name: 'Rachel Lewis',
    amount: 1156.25,
    status: 'pending',
    email: 'rachel.lewis@local.test'
  },
  {
    id: '21',
    name: 'Thomas Young',
    amount: 543.6,
    status: 'paid',
    email: 'thomas.young@local.test'
  },
  {
    id: '22',
    name: 'Stephanie Brown',
    amount: 789.3,
    status: 'processing',
    email: 'stephanie.brown@local.test'
  },
  {
    id: '23',
    name: 'Brandon Moore',
    amount: 425.75,
    status: 'failed',
    email: 'brandon.moore@local.test'
  },
  {
    id: '24',
    name: 'Kelly Taylor',
    amount: 1203.5,
    status: 'paid',
    email: 'kelly.taylor@local.test'
  },
  {
    id: '25',
    name: 'Mark Anderson',
    amount: 356.2,
    status: 'pending',
    email: 'mark.anderson@local.test'
  }
]

const DataTableBasic = () => {
  return (
    <Card className='py-0'>
      <DataTableDemo data={transactionData} />
    </Card>
  )
}

export default DataTableBasic
