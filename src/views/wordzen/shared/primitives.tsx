'use client'

import type { ReactNode } from 'react'

import { CountUp } from '@/components/shared/CountUp'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { CourseAccessCode, LocaleCode } from '@/types/wordzen/content-types'
import type {
  BillingSubscriptionStatus,
  CardBrand,
  CurrencyCode,
  PaymentCard,
  ProviderCode,
  TransactionStatusCode
} from '@/types/wordzen/payment-types'
import {
  formatAmount,
  formatAmountValue,
  LIVE_PROVIDER_CODES,
  OPEN_TRANSACTION_STATUSES
} from '@/types/wordzen/payment-types'
import type { RoleCode, UserStatusCode } from '@/types/wordzen/user-types'
import { primaryRole } from '@/types/wordzen/user-types'

/** `true`/`false` on `isPublic`, phrased the way the API means it. */
export function PublishedBadge({ isPublic }: { isPublic: boolean }) {
  const { t } = useTranslation()

  return (
    <Badge variant={isPublic ? 'default' : 'outline'}>
      {isPublic ? t('manage.badges.public') : t('manage.badges.draft')}
    </Badge>
  )
}

/** `CourseAccessCode` — FREE is unremarkable, the paid tiers should stand out. */
export function AccessBadge({ accessCode }: { accessCode: CourseAccessCode }) {
  return <Badge variant={accessCode === 'FREE' ? 'outline' : 'secondary'}>{accessCode}</Badge>
}

export function LocaleBadge({ locale }: { locale: LocaleCode }) {
  return (
    <Badge variant='outline' className='font-mono text-[11px]'>
      {locale}
    </Badge>
  )
}

/**
 * `Achievement.active`. An inactive achievement is not deleted: it stays in the table with
 * its grants and drops out of every endpoint that filters on the flag.
 */
export function ActiveBadge({ active }: { active: boolean }) {
  const { t } = useTranslation()

  return (
    <Badge variant={active ? 'default' : 'outline'}>
      {active ? t('manage.badges.active') : t('manage.badges.inactive')}
    </Badge>
  )
}

/** The account's most privileged role — ROLE_USER is unremarkable, staff should stand out. */
export function UserRoleBadge({ roles }: { roles: RoleCode[] }) {
  const { t } = useTranslation()

  const role = primaryRole(roles)

  return <Badge variant={role === 'ROLE_USER' ? 'outline' : 'secondary'}>{t(`manage.roles.${role}`)}</Badge>
}

export function UserStatusBadge({ status }: { status: UserStatusCode }) {
  const { t } = useTranslation()

  return <Badge variant={status === 'BLOCKED' ? 'destructive' : 'secondary'}>{t(`manage.statuses.${status}`)}</Badge>
}

/**
 * The brand marks under `public/images/brands`, by the code they stand for.
 *
 * Partial on purpose: Click has no mark to be found and Uzcard is not a brand the ledger
 * carries, so anything missing falls back to its code in text. Plain `<img>` rather than
 * `next/image` because these are tiny fixed-size logos, two of them SVG — the optimizer
 * refuses SVG without `dangerouslyAllowSVG`, and there is nothing here to optimize.
 */
const PROVIDER_LOGOS: Partial<Record<ProviderCode, string>> = {
  MULTICARD: '/images/brands/multicard.png',
  PAYME: '/images/brands/payme.png',
  TELEGRAM: '/images/brands/telegram.svg',
  APPLE: '/images/brands/apple.svg',
  GOOGLE_PLAY: '/images/brands/google-play.svg'
}

const CARD_BRAND_LOGOS: Record<CardBrand, string> = {
  HUMO: '/images/brands/humo.png',
  VISA: '/images/brands/visa.svg',
  MASTERCARD: '/images/brands/mastercard.svg'
}

/**
 * A logo on a white tile, the way a payment sheet shows one.
 *
 * The tile is what makes one asset enough for both themes: these marks are a mix of
 * colour, black and gold, and several of them would vanish on a dark background.
 */
export function BrandMark({ src, className }: { src: string; className?: string }) {
  return (
    <span
      className={cn(
        'ring-border/60 flex size-6 shrink-0 items-center justify-center rounded-sm bg-white p-[3px] ring-1',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt='' className='max-h-full max-w-full object-contain' />
    </span>
  )
}

/**
 * `ProviderCode` — its mark where there is one, and the code itself, which stays because
 * it is what the API says and what the filters are named after.
 *
 * CLICK and PAYME are drawn muted and say so on hover: `initiatePayment` answers 410 for
 * both, so a payment on either is history rather than something that could recur.
 */
export function ProviderBadge({ provider }: { provider: ProviderCode }) {
  const { t } = useTranslation()

  const retired = !LIVE_PROVIDER_CODES.includes(provider)
  const logo = PROVIDER_LOGOS[provider]

  return (
    <span className='inline-flex items-center gap-2' title={retired ? t('manage.payments.providerRetired') : undefined}>
      {logo ? <BrandMark src={logo} className={cn(retired && 'opacity-70')} /> : null}
      <Badge variant='outline' className={cn('font-mono text-[11px]', retired && 'text-muted-foreground')}>
        {provider}
      </Badge>
    </span>
  )
}

/** `card_tokens`: the network's mark and the masked number the provider returned. */
export function CardMark({ card }: { card: PaymentCard }) {
  return (
    <span className='text-muted-foreground inline-flex items-center gap-2 text-xs' title={card.brand}>
      <BrandMark src={CARD_BRAND_LOGOS[card.brand]} className='size-5' />
      <span className='font-mono'>{card.number}</span>
    </span>
  )
}

/**
 * An amount with its currency.
 *
 * Telegram stars are a mark rather than a code — `TG_STARS` next to a number reads like a
 * database value, and the star is what the payer saw — while UZS and USD keep theirs.
 */
export function AmountCell({ amount, currency }: { amount: number; currency: CurrencyCode }) {
  if (currency !== 'TG_STARS') {
    return <span className='text-sm font-medium'>{formatAmount(amount, currency)}</span>
  }

  return (
    <span className='inline-flex items-center gap-1.5 text-sm font-medium' title={currency}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src='/images/brands/telegram-stars.svg' alt='' className='size-4' />
      {formatAmountValue(amount, currency)}
    </span>
  )
}

/**
 * `TransactionStatusCode`, read at a glance: money in is green, a payment that did not go
 * through is red, one still in flight is neutral, and a refund is its own settled outcome.
 *
 * Green has no token of its own — the palette carries no success colour — so it is the
 * emerald pair the dashboard trend pills already use for "good", tinted the way the
 * destructive badge tints red.
 */
export function TransactionStatusBadge({ status }: { status: TransactionStatusCode }) {
  const { t } = useTranslation()

  const failed = status === 'FAILED' || status === 'CANCELLED'

  return (
    <Badge
      variant={failed ? 'destructive' : OPEN_TRANSACTION_STATUSES.includes(status) ? 'secondary' : 'outline'}
      className={cn(
        status === 'SUCCESS' &&
          'border-transparent bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-500'
      )}
    >
      {t(`manage.transactionStatuses.${status}`)}
    </Badge>
  )
}

/** `BillingSubscriptionStatus` — PAST_DUE is the one that wants attention. */
export function SubscriptionStatusBadge({ status }: { status: BillingSubscriptionStatus }) {
  const { t } = useTranslation()

  const variant =
    status === 'ACTIVE'
      ? 'default'
      : status === 'PAST_DUE'
        ? 'destructive'
        : status === 'CANCELLED' || status === 'PAUSED'
          ? 'secondary'
          : 'outline'

  return <Badge variant={variant}>{t(`manage.subscriptionStatuses.${status}`)}</Badge>
}

/**
 * A stored file path (`cover`, `image`). The API holds a path from the manager file
 * service, not a URL, so there is nothing to render as an image here — showing the path
 * is both honest and the thing an admin actually needs to check.
 */
export function FilePathCell({ path, emptyLabel }: { path: string | null; emptyLabel?: string }) {
  const { t } = useTranslation()

  if (!path) {
    return <span className='text-muted-foreground text-sm'>{emptyLabel ?? t('manage.badges.none')}</span>
  }

  return (
    <code className='bg-muted text-muted-foreground max-w-56 truncate rounded px-1.5 py-0.5 text-xs' title={path}>
      {path}
    </code>
  )
}

export type StatCardItem = {
  label: string
  value: ReactNode

  /**
   * Formats a numeric `value` on every frame of its count-up — pass this for a figure that
   * carries a unit or separators. Ignored when `value` is not a number.
   */
  format?: (value: number) => string
  hint?: string
  icon?: ReactNode
}

/**
 * The stat row the manage pages open with. The icon badge matches the dashboard's
 * `MetricTile`, so a figure reads the same on either side of the panel; it is optional
 * because the icon only ever restates the label and must not be load-bearing.
 *
 * A numeric `value` counts up on arrival; anything else is rendered as given, since a
 * ReactNode has no figure to count towards.
 */
export function StatCards({ items }: { items: StatCardItem[] }) {
  return (
    <div className='grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6'>
      {items.map(item => (
        <Card key={item.label} className='shadow-none'>
          <CardContent className='flex flex-col gap-1'>
            <span className='text-muted-foreground flex items-center gap-2 text-sm'>
              {item.icon ? (
                <span
                  aria-hidden
                  className='bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-sm'
                >
                  {item.icon}
                </span>
              ) : null}
              {item.label}
            </span>
            <span className='text-2xl font-semibold'>
              {typeof item.value === 'number' ? <CountUp value={item.value} format={item.format} /> : item.value}
            </span>
            {item.hint ? <span className='text-muted-foreground text-xs'>{item.hint}</span> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  onConfirm: () => void
}

/**
 * Delete confirmation. Deletes in the manager API remove the row outright
 * (`ManagerCourseDao.delete` hard-deletes), and a course takes its modules and cards with
 * it, so the copy has to say what is actually about to disappear.
 */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm }: ConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant='outline' type='button'>
                {t('common.cancel')}
              </Button>
            }
            nativeButton={false}
          />
          <Button
            variant='destructive'
            type='button'
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel ?? t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** A short label/value pair for the detail panels. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='flex flex-wrap items-baseline justify-between gap-2 py-2'>
      <span className='text-muted-foreground text-sm'>{label}</span>
      <span className='text-right text-sm font-medium'>{children}</span>
    </div>
  )
}

/** `createdAt`/`blockedAt` rendering. Fixed locale and UTC so SSR and hydration agree. */
export function Timestamp({ value, withTime = false }: { value: string | null; withTime?: boolean }) {
  if (!value) {
    return <span className='text-muted-foreground'>-</span>
  }

  const date = new Date(value)

  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(date)

  return <span title={value}>{formatted}</span>
}
