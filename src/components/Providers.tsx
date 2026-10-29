// React Imports
import type { ReactNode } from 'react'

// Config Imports
import type { UILanguage } from '@/configs/i18nConfig'

// Component Imports
import { I18nProvider } from '@/lib/i18n'
import { ThemeProvider } from './ThemeProvider'
import { SidebarProvider } from './ui/sidebar'
import { TooltipProvider } from './ui/tooltip'

type Props = {
  children: ReactNode
  sidebarDefaultOpen?: boolean
  initialLanguage?: UILanguage
}

const Providers = ({ children, sidebarDefaultOpen, initialLanguage }: Props) => {
  return (
    <I18nProvider initialLanguage={initialLanguage}>
      <ThemeProvider attribute='class' defaultTheme='system' enableSystem={true}>
        <TooltipProvider>
          <SidebarProvider defaultOpen={sidebarDefaultOpen}>{children}</SidebarProvider>
        </TooltipProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

export default Providers
