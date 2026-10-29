// Type Imports
import type { UserFilters, UserPlan, UserRole, UserStatus } from '@/types/apps/user-types'

// Component Imports
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

const ROLES: UserRole[] = ['Admin', 'Editor', 'Subscriber', 'Maintainer', 'Guest']
const PLANS: UserPlan[] = ['Basic', 'Team', 'Enterprise']
const STATUSES: UserStatus[] = ['Active', 'Pending', 'Suspended', 'Inactive']

export interface UserTableFiltersProps {
  filters: UserFilters
  onFilterChange: (filters: Partial<UserFilters>) => void
}

export function UserTableFilters({ filters, onFilterChange }: UserTableFiltersProps) {
  const { t } = useTranslation()

  // The `value` of each option stays the raw enum so filtering is unaffected by language.
  const allItem = { label: t('users.filters.all'), value: 'all' }
  const roleItems = [allItem, ...ROLES.map(role => ({ label: t(`users.roles.${role}`), value: role }))]
  const planItems = [allItem, ...PLANS.map(plan => ({ label: t(`users.plans.${plan}`), value: plan }))]
  const statusItems = [allItem, ...STATUSES.map(status => ({ label: t(`users.statuses.${status}`), value: status }))]

  return (
    <div className='flex flex-col gap-4 border-b p-6'>
      <div className='grid grid-cols-1 gap-6 max-md:*:last:col-span-full sm:grid-cols-2 md:grid-cols-3'>
        <div className='flex w-full flex-col gap-2'>
          <Label htmlFor='filter-role'>{t('users.filters.selectRole')}</Label>
          <Select
            items={roleItems}
            value={filters.role}
            onValueChange={(value: string | null) => {
              if (value) {
                onFilterChange({ role: value as UserFilters['role'] })
              }
            }}
          >
            <SelectTrigger id='filter-role' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value='all'>{t('users.filters.all')}</SelectItem>
                {ROLES.map(role => (
                  <SelectItem key={role} value={role}>
                    {t(`users.roles.${role}`)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className='flex w-full flex-col gap-2'>
          <Label htmlFor='filter-plan'>{t('users.filters.selectPlan')}</Label>
          <Select
            items={planItems}
            value={filters.plan}
            onValueChange={(value: string | null) => {
              if (value) {
                onFilterChange({ plan: value as UserFilters['plan'] })
              }
            }}
          >
            <SelectTrigger id='filter-plan' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value='all'>{t('users.filters.all')}</SelectItem>
                {PLANS.map(plan => (
                  <SelectItem key={plan} value={plan}>
                    {t(`users.plans.${plan}`)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className='flex w-full flex-col gap-2'>
          <Label htmlFor='filter-status'>{t('users.filters.selectStatus')}</Label>
          <Select
            items={statusItems}
            value={filters.status}
            onValueChange={(value: string | null) => {
              if (value) {
                onFilterChange({ status: value as UserFilters['status'] })
              }
            }}
          >
            <SelectTrigger id='filter-status' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value='all'>{t('users.filters.all')}</SelectItem>
                {STATUSES.map(status => (
                  <SelectItem key={status} value={status}>
                    {t(`users.statuses.${status}`)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
