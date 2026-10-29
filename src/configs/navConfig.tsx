// Third-party Imports
import type * as Icon from 'lucide-react'

type IconName = keyof typeof Icon

export type MenuLeafSubItem = {
  label: string
  href: string
  activePath?: string
  badge?: string
  badgeClassName?: string
  target?: '_blank' | '_self' | '_parent' | '_top'
}

export type MenuGroupSubItem = {
  label: string
  childItems: MenuLeafSubItem[]
}

export type MenuSubItem = MenuLeafSubItem | MenuGroupSubItem

export type MenuItem = {
  icon: IconName
  label: string
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
  groupLabel?: string
  items: MenuItem[]
}

export const navItems: NavItem[] = [
  {
    groupLabel: 'Dashboard',
    items: [
      {
        icon: 'Package',
        label: 'Orders',
        href: '/dashboard/orders'
      }
    ]
  },
  {
    groupLabel: 'Apps',
    items: [
      {
        icon: 'MailIcon',
        label: 'Mail',
        href: '/apps/mail'
      },
      {
        icon: 'CalendarIcon',
        label: 'Calendar',
        href: '/apps/calendar'
      },
      {
        icon: 'UsersIcon',
        label: 'Users',
        childItems: [
          { label: 'List', href: '/apps/users/list' },
          { label: 'View', href: '/apps/users/view' }
        ]
      }
    ]
  },
  {
    groupLabel: 'Pages',
    items: [
      {
        icon: 'UserCogIcon',
        label: 'User Settings',
        childItems: [
          { label: 'General', href: '/pages/user-settings?setting=general' },
          { label: 'Workspace', href: '/pages/user-settings?setting=workspace' }
        ]
      },
      {
        icon: 'UserIcon',
        label: 'User Profile',
        childItems: [
          { label: 'Profile', href: '/pages/user-profile?view=profile' },
          { label: 'Connections', href: '/pages/user-profile?view=connections' }
        ]
      },
      {
        icon: 'LockKeyholeIcon',
        label: 'Authentication',
        childItems: [
          { label: 'Login', href: '/pages/auth/login', target: '_blank' },
          { label: 'Register', href: '/pages/auth/register', target: '_blank' },
          { label: 'Forgot Password', href: '/pages/auth/forgot-password', target: '_blank' },
          { label: 'Verify Email', href: '/pages/auth/verify-email', target: '_blank' },
          { label: 'Reset Password', href: '/pages/auth/reset-password', target: '_blank' },
          { label: 'Two Steps', href: '/pages/auth/two-steps', target: '_blank' }
        ]
      },
      {
        icon: 'BugIcon',
        label: 'Error Page',
        href: '/pages/misc/error-page',
        target: '_blank'
      }
    ]
  },
  {
    groupLabel: 'Forms & Tables',
    items: [
      {
        icon: 'LayoutTemplateIcon',
        label: 'Form Layouts',
        childItems: [
          { label: 'Vertical Layout', href: '/forms/form-layouts/vertical' },
          { label: 'Horizontal Layout', href: '/forms/form-layouts/horizontal' }
        ]
      },
      {
        icon: 'BadgeCheckIcon',
        label: 'Form Validation',
        href: '/forms/form-validation'
      },
      {
        icon: 'TableIcon',
        label: 'Data Table',
        href: '/datatable'
      }
    ]
  },
  {
    groupLabel: 'Miscellaneous',
    items: [
      {
        icon: 'MenuIcon',
        label: 'Menu Level',
        childItems: [
          {
            label: 'Menu Item ',
            href: '#'
          },
          {
            label: 'Menu Level 1',
            childItems: [{ label: 'Menu Level 2', href: '#' }]
          }
        ]
      }
    ]
  }
]
