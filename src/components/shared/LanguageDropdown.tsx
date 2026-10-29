'use client'

import type { ReactElement } from 'react'

// Config Imports
import { LANGUAGE_LABELS, UI_LANGUAGES, type UILanguage } from '@/configs/i18nConfig'

// Component Imports
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Hook Imports
import { useTranslation } from '@/lib/i18n'

type Props = {
  trigger: ReactElement
  defaultOpen?: boolean
  align?: 'start' | 'center' | 'end'
}

const LanguageDropdown = ({ defaultOpen, align, trigger }: Props) => {
  const { language, setLanguage } = useTranslation()

  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent className='w-50' align={align || 'end'}>
        <DropdownMenuRadioGroup value={language} onValueChange={value => setLanguage(value as UILanguage)}>
          {UI_LANGUAGES.map(code => (
            <DropdownMenuRadioItem key={code} value={code}>
              {LANGUAGE_LABELS[code]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageDropdown
