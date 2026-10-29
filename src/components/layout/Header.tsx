'use client'

// Next Imports
import { Fragment } from 'react'

import { usePathname } from 'next/navigation'

// Third-party Imports
import { LanguagesIcon } from 'lucide-react'

// Component Imports
import LanguageDropdown from '@/components/shared/LanguageDropdown'
import ModeToggle from '@/components/layout/ModeToggle'
import ProfileDropdown from '@/components/shared/ProfileDropdown'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { AuditHistoryDrawer } from '@/views/wordzen/analytics/audit-history-drawer'

// Hook Imports
import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

// Title-cases a path segment, for a route no `routes.*` key covers yet.
const prettifySegment = (segment: string) => segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const Header = () => {
  const pathname = usePathname()
  const { t } = useTranslation()

  const segments = pathname.split('/').filter(Boolean)

  // `t` echoes the key back when nothing matches, which is the signal to fall back.
  const segmentLabel = (segment: string) => {
    const key = `routes.${segment}` as TranslationKey
    const translated = t(key)

    return translated === key ? prettifySegment(segment) : translated
  }

  return (
    <header className='bg-card sticky top-0 z-50 border-b'>
      <div className='mx-auto flex max-w-360 items-center justify-between gap-6 px-4 py-2 sm:px-6'>
        <div className='flex items-center gap-4'>
          <SidebarTrigger className='[&_svg]:size-5!' />
          <Separator orientation='vertical' className='hidden h-4! data-vertical:self-center sm:block' />
          <Breadcrumb className='hidden sm:block'>
            <BreadcrumbList>
              {segments.map((segment, index) => {
                const isLast = index === segments.length - 1
                const label = segmentLabel(segment)
                const href = '/' + segments.slice(0, index + 1).join('/')

                return (
                  <Fragment key={href}>
                    <BreadcrumbItem>
                      {isLast ? <BreadcrumbPage>{label}</BreadcrumbPage> : <BreadcrumbLink>{label}</BreadcrumbLink>}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className='flex items-center gap-1.5'>
          {/* Reachable from every page: the trail covers the whole panel, not one view. */}
          <AuditHistoryDrawer />
          <ModeToggle />
          <LanguageDropdown
            trigger={
              <Button variant='ghost' size='icon-lg' aria-label={t('chrome.changeLanguage')}>
                <LanguagesIcon />
              </Button>
            }
          />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}

export default Header
