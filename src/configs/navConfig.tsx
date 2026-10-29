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
  // The real tools come first; the groups below are template pages kept as reference.
  {
    groupLabelKey: 'nav.groups.manage',
    items: [
      {
        icon: 'LibraryBig',
        labelKey: 'nav.manageCourses',
        href: '/manage/courses'
      },
      {
        icon: 'UsersRound',
        labelKey: 'nav.manageUsers',
        href: '/manage/users'
      }
    ]
  },
  {
    groupLabelKey: 'nav.groups.dashboard',
    items: [
      {
        icon: 'Package',
        labelKey: 'nav.orders',
        href: '/dashboard/orders'
      }
    ]
  },
  {
    groupLabelKey: 'nav.groups.apps',
    items: [
      {
        icon: 'UsersIcon',
        labelKey: 'nav.users',
        childItems: [
          { labelKey: 'nav.usersList', href: '/apps/users/list' },
          { labelKey: 'nav.usersView', href: '/apps/users/view' }
        ]
      }
    ]
  },
  {
    groupLabelKey: 'nav.groups.pages',
    items: [
      {
        icon: 'UserCogIcon',
        labelKey: 'nav.userSettings',
        childItems: [
          { labelKey: 'nav.settingsGeneral', href: '/pages/user-settings?setting=general' },
          { labelKey: 'nav.settingsWorkspace', href: '/pages/user-settings?setting=workspace' }
        ]
      },
      {
        icon: 'LockKeyholeIcon',
        labelKey: 'nav.authentication',
        childItems: [
          { labelKey: 'nav.authLogin', href: '/pages/auth/login', target: '_blank' },
          { labelKey: 'nav.authRegister', href: '/pages/auth/register', target: '_blank' },
          { labelKey: 'nav.authForgotPassword', href: '/pages/auth/forgot-password', target: '_blank' },
          { labelKey: 'nav.authVerifyEmail', href: '/pages/auth/verify-email', target: '_blank' },
          { labelKey: 'nav.authResetPassword', href: '/pages/auth/reset-password', target: '_blank' },
          { labelKey: 'nav.authTwoSteps', href: '/pages/auth/two-steps', target: '_blank' }
        ]
      },
      {
        icon: 'BugIcon',
        labelKey: 'nav.errorPage',
        href: '/pages/misc/error-page',
        target: '_blank'
      }
    ]
  },
  {
    groupLabelKey: 'nav.groups.formsAndTables',
    items: [
      {
        icon: 'LayoutTemplateIcon',
        labelKey: 'nav.formLayouts',
        childItems: [
          { labelKey: 'nav.formLayoutsVertical', href: '/forms/form-layouts/vertical' },
          { labelKey: 'nav.formLayoutsHorizontal', href: '/forms/form-layouts/horizontal' }
        ]
      },
      {
        icon: 'BadgeCheckIcon',
        labelKey: 'nav.formValidation',
        href: '/forms/form-validation'
      },
      {
        icon: 'TableIcon',
        labelKey: 'nav.dataTable',
        href: '/datatable'
      }
    ]
  }
]
