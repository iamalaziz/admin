'use client'

import Link from 'next/link'

import { ArrowUpRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PaymentMonth } from '@/hooks/wordzen/use-payment-list'
import { useUserPayments } from '@/hooks/wordzen/use-payment-list'
import { useTranslation } from '@/lib/i18n'
import type { CurrencyCode } from '@/types/wordzen/payment-types'
import { CURRENCY_CODES, formatCoins } from '@/types/wordzen/payment-types'

import { AmountCell } from '../shared/primitives'

/**
 * `2026-10` as `Oct 2026`.
 *
 * Pinned to `en-GB` for the reason `Timestamp` pins it: the card renders on the server and
 * again on the client, and a locale-dependent month name would differ between the passes.
 */
const MONTH_FORMAT = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })

const monthLabel = (month: string) => MONTH_FORMAT.format(new Date(`${month}-01T00:00:00.000Z`))

/** The currencies a month actually collected, in the order the enum lists them. */
const currenciesOf = (amounts: PaymentMonth['amounts']): CurrencyCode[] =>
  CURRENCY_CODES.filter(currency => (amounts[currency] ?? 0) > 0)

/**
 * A payer's last twelve months, on the user page.
 *
 * The bar is scaled by coins rather than by money because coins are the one figure every
 * payment shares: the amounts are in different currencies, and a store subscription
 * reports no amount at all. The money sits beside it, one total per currency, unsummed.
 */
export function UserPaymentsCard({ uid }: { uid: string }) {
  const { t } = useTranslation()
  const { months, peakCoins, totals } = useUserPayments(uid)

  return (
    <Card className='shadow-none lg:col-span-2'>
      <CardHeader>
        <CardTitle className='text-base'>{t('manage.userDetail.payments.title')}</CardTitle>
        <CardDescription>{t('manage.userDetail.payments.description')}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <div className='flex flex-wrap items-baseline gap-x-6 gap-y-1'>
          <span className='text-2xl font-semibold'>
            {totals.succeeded}
            <span className='text-muted-foreground text-base font-normal'> / {totals.payments}</span>
          </span>
          <span className='text-muted-foreground text-sm'>
            {t('manage.userDetail.payments.summary', { coins: formatCoins(totals.coins) })}
          </span>
        </div>

        {totals.payments === 0 ? (
          <p className='text-muted-foreground text-sm'>{t('manage.userDetail.payments.empty')}</p>
        ) : (
          <ul className='flex flex-col'>
            {months.map(month => {
              const share = peakCoins === 0 ? 0 : Math.round((month.coins / peakCoins) * 100)
              const currencies = currenciesOf(month.amounts)

              return (
                <li
                  key={month.month}
                  className='flex flex-wrap items-center gap-x-4 gap-y-1 border-t py-2 first:border-t-0'
                >
                  <span className='text-muted-foreground w-20 shrink-0 text-sm tabular-nums'>
                    {monthLabel(month.month)}
                  </span>

                  {/* Not a Progress: this is a bar per row in a list, and an empty month
                      has to stay visible as a track rather than disappear. */}
                  <span className='bg-muted h-2 min-w-24 flex-1 overflow-hidden rounded-full'>
                    <span className='bg-primary block h-full rounded-full' style={{ width: `${share}%` }} />
                  </span>

                  <span className='flex flex-wrap items-center justify-end gap-x-3 gap-y-1'>
                    {currencies.map(currency => (
                      <AmountCell key={currency} amount={month.amounts[currency] ?? 0} currency={currency} />
                    ))}
                    <span className='text-muted-foreground w-24 shrink-0 text-right text-xs'>
                      {month.payments === 0
                        ? t('manage.userDetail.payments.none')
                        : t('manage.userDetail.payments.count', { count: month.payments })}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        <Button
          render={<Link href='/manage/payments' />}
          nativeButton={false}
          variant='outline'
          size='sm'
          className='w-fit'
        >
          {t('manage.userDetail.payments.openLedger')}
          <ArrowUpRightIcon className='size-4' />
        </Button>
      </CardContent>
    </Card>
  )
}
