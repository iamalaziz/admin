// Third-party Imports
import type * as Icon from 'lucide-react'

// Type Imports
import type { TranslationKey } from '@/lib/i18n'

type IconName = keyof typeof Icon

export type MenuLeafSubItem = {
  labelKey: TranslationKey
  href: string
  activePath?: string
  badge?: string
  badgeClassName?: string
  target?: '_blank' | '_self' | '_parent' | '_top'
}

export type MenuGroupSubItem = {
  labelKey: TranslationKey
  childItems: MenuLeafSubItem[]
}

export type MenuSubItem = MenuLeafSubItem | MenuGroupSubItem

export type MenuItem = {
  icon: IconName
  labelKey: TranslationKey
} & (
  | {
      href: string
      badge?: string
      badgeClassName?: string
      childItems?: never
      target?: '_blank' | '_self' | '_parent' | '_top'
    }
  | {
      href?: never
      badge?: string
      badgeClassName?: string
      childItems: MenuSubItem[]
    }
)

export type NavItem = {
  groupLabelKey?: TranslationKey
  items: MenuItem[]
}

export const navItems: NavItem[] = [
  // Four candidate layouts for the same analytics data, listed side by side so they can be
  // compared. Once one is chosen, this group collapses to a single link.
  {
    groupLabelKey: 'nav.groups.dashboards',
    items: [
      {
        icon: 'LayoutDashboard',
        labelKey: 'nav.dashboardCommandCenter',
        href: '/dashboard/command-center'
      },
      {
        icon: 'ChartNoAxesCombined',
        labelKey: 'nav.dashboardEngagement',
        href: '/dashboard/engagement'
      },
      {
        icon: 'Clock',
        labelKey: 'nav.dashboardTiming',
        href: '/dashboard/timing'
      },
      {
        icon: 'Gauge',
        labelKey: 'nav.dashboardExecutive',
        href: '/dashboard/executive'
      }
    ]
  },

  // The real tools come next; the group below that holds the standalone pages.
  {
    groupLabelKey: 'nav.groups.manage',
    items: [
      {
        icon: 'LibraryBig',
        labelKey: 'nav.manageCourses',
        href: '/manage/courses'
      },
      {
        icon: 'Tags',
        labelKey: 'nav.manageCategories',
        href: '/manage/categories'
      },
      {
        icon: 'Trophy',
        labelKey: 'nav.manageAchievements',
        href: '/manage/achievements'
      },
      {
        icon: 'UsersRound',
        labelKey: 'nav.manageUsers',
        href: '/manage/users'
      },
      {
        icon: 'CreditCard',
        labelKey: 'nav.managePayments',
        href: '/manage/payments'
      }
    ]
  },
  {
    groupLabelKey: 'nav.groups.pages',
    items: [
      {
        icon: 'SettingsIcon',
        labelKey: 'chrome.settings',
        href: '/pages/user-settings?setting=general'
      }
    ]
  }
]
