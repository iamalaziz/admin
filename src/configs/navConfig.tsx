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
  // The real tools come first; the group below holds the standalone pages.
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
