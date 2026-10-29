// React Imports
import type { ReactNode } from 'react'

// Component Imports
import { I18nProvider } from '@/lib/i18n'
import { ThemeProvider } from './ThemeProvider'
import { SidebarProvider } from './ui/sidebar'
import { TooltipProvider } from './ui/tooltip'

type Props = {
  children: ReactNode
  sidebarDefaultOpen?: boolean
}

const Providers = ({ children, sidebarDefaultOpen }: Props) => {
  return (
    <I18nProvider>
      <ThemeProvider attribute='class' defaultTheme='system' enableSystem={true}>
        <TooltipProvider>
          <SidebarProvider defaultOpen={sidebarDefaultOpen}>{children}</SidebarProvider>
        </TooltipProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

export default Providers
