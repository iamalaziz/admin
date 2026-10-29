'use client'

// React Imports
import { useState, type ComponentType, type SVGAttributes } from 'react'

// Third-party Imports
import { LinkIcon, PaletteIcon, Trash2Icon } from 'lucide-react'

// Type Imports
import type { AppUser, SocialPlatform } from '@/types/apps/user-types'

// Component Imports
import FacebookIcon from '@/assets/svg/facebook-icon'
import GithubIcon from '@/assets/svg/github-icon'
import LinkedinIcon from '@/assets/svg/linkedin-icon'
import TwitterIcon from '@/assets/svg/twitter-icon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

// Util Imports
import { cn } from '@/lib/utils'

// Hook Imports
import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

interface BrandItem {
  image?: string
  icon?: string
}

interface ConnectedIntegration extends BrandItem {
  id: string
  name: string
  descriptionKey: TranslationKey
  enabled?: boolean
}

interface SocialAccount extends BrandItem {
  platform: SocialPlatform
  label: string
}

const ICONS: Record<string, ComponentType<SVGAttributes<SVGElement>>> = {
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
  github: GithubIcon,
  dribbble: PaletteIcon,
  mailchimp: PaletteIcon
}

const CONNECTED_INTEGRATIONS: ConnectedIntegration[] = [
  {
    id: 'google',
    name: 'Google',
    descriptionKey: 'users.connections.integrations.googleDescription',
    image: '/images/brands/google-icon.webp',
    enabled: true
  },
  {
    id: 'slack',
    name: 'Slack',
    descriptionKey: 'users.connections.integrations.slackDescription',
    image: '/images/brands/slack-icon.webp',
    enabled: false
  },
  {
    id: 'github',
    name: 'Github',
    descriptionKey: 'users.connections.integrations.githubDescription',
    image: '/images/brands/github-white.webp',
    enabled: true
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    descriptionKey: 'users.connections.integrations.mailchimpDescription',
    image: '/images/brands/mailchimp-icon.webp',
    enabled: false
  },
  {
    id: 'asana',
    name: 'Asana',
    descriptionKey: 'users.connections.integrations.asanaDescription',
    image: '/images/brands/asana-icon-circle.webp',
    enabled: false
  }
]

const SOCIAL_ACCOUNTS: SocialAccount[] = [
  { platform: 'facebook', label: 'Facebook', icon: 'facebook' },
  { platform: 'twitter', label: 'Twitter', icon: 'twitter' },
  { platform: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
  { platform: 'dribbble', label: 'Dribbble', icon: 'dribbble' }
]

function BrandAvatar({ item, alt }: { item: BrandItem; alt: string }) {
  const Icon = item.icon ? ICONS[item.icon] : null

  return (
    <Avatar className='size-10 rounded-lg after:rounded-lg'>
      {item.image ? <AvatarImage src={item.image} alt={alt} className='rounded-lg object-contain p-1.5' /> : null}
      <AvatarFallback className='rounded-lg'>{Icon ? <Icon className='size-5' /> : null}</AvatarFallback>
    </Avatar>
  )
}

function getSocialHandle(url: string): string {
  const handle = url.replace(/\/$/, '').split('/').pop() ?? url

  return handle.startsWith('@') ? handle : `@${handle}`
}

export interface ConnectionsTabProps {
  user: AppUser
}

export function ConnectionsTab({ user }: ConnectionsTabProps) {
  const { t } = useTranslation()

  const [integrationToggles, setIntegrationToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CONNECTED_INTEGRATIONS.map(integration => [integration.id, integration.enabled ?? false]))
  )

  const socialLinks = user.socialLinks ?? []

  return (
    <div className='space-y-6'>
      <Card className='gap-0 py-0'>
        <CardHeader className='border-b px-6 py-4!'>
          <CardTitle className='text-base'>{t('users.connections.connectedAccounts')}</CardTitle>
          <p className='text-muted-foreground text-sm'>{t('users.connections.connectedAccountsDescription')}</p>
        </CardHeader>
        <CardContent className='px-0 pb-0'>
          <div className='divide-y'>
            {CONNECTED_INTEGRATIONS.map(integration => (
              <div key={integration.id} className='flex flex-wrap items-center justify-between gap-4 px-6 py-4'>
                <div className='flex min-w-0 flex-1 items-center gap-4'>
                  <BrandAvatar item={integration} alt={integration.name} />
                  <div className='min-w-0'>
                    <p className='font-medium'>{integration.name}</p>
                    <p className='text-muted-foreground text-sm'>{t(integration.descriptionKey)}</p>
                  </div>
                </div>
                <Switch
                  checked={integrationToggles[integration.id] ?? false}
                  onCheckedChange={value => setIntegrationToggles(prev => ({ ...prev, [integration.id]: value }))}
                  aria-label={t('users.connections.toggle', { name: integration.name })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className='gap-0 py-0'>
        <CardHeader className='border-b px-6 py-4!'>
          <CardTitle className='text-base'>{t('users.connections.socialAccounts')}</CardTitle>
          <p className='text-muted-foreground text-sm'>{t('users.connections.socialAccountsDescription')}</p>
        </CardHeader>
        <CardContent className='px-0 pb-0'>
          <div className='divide-y'>
            {SOCIAL_ACCOUNTS.map(account => {
              const linkedAccount = socialLinks.find(link => link.platform === account.platform)
              const isConnected = Boolean(linkedAccount)

              return (
                <div key={account.platform} className='flex flex-wrap items-center justify-between gap-4 px-6 py-4'>
                  <div className='flex min-w-0 flex-1 items-center gap-4'>
                    <BrandAvatar item={account} alt={account.label} />
                    <div className='min-w-0'>
                      <p className='font-medium'>{account.label}</p>
                      {isConnected && linkedAccount ? (
                        <a
                          href={linkedAccount.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary text-sm hover:underline'
                        >
                          {getSocialHandle(linkedAccount.url)}
                        </a>
                      ) : (
                        <p className='text-muted-foreground text-sm'>{t('users.connections.notConnected')}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    className={cn(
                      'size-9 shrink-0 rounded-lg',
                      isConnected
                        ? 'bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                    aria-label={
                      isConnected
                        ? t('users.connections.disconnect', { name: account.label })
                        : t('users.connections.connect', { name: account.label })
                    }
                  >
                    {isConnected ? <Trash2Icon className='size-4.5' /> : <LinkIcon className='size-4.5' />}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
