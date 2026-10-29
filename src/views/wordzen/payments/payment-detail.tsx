'use client'

import { useState } from 'react'

import Link from 'next/link'

import { ArrowLeftIcon, ArrowUpRightIcon, BanIcon, HourglassIcon, RotateCcwIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine
} from '@/components/ui/timeline'
import { usePaymentDetail } from '@/hooks/wordzen/use-payment-list'
import { useTranslation } from '@/lib/i18n'
import type { PaymentTransactionEvent } from '@/types/wordzen/payment-types'
import { canCancelSubscription, canRefundSubscription, formatCoins, shortUid } from '@/types/wordzen/payment-types'

import {
  AmountCell,
  CardMark,
  ConfirmDialog,
  DetailRow,
  ProviderBadge,
  SubscriptionStatusBadge,
  Timestamp,
  TransactionStatusBadge
} from '../shared/primitives'

/** A `payment_transactions_history` row's dot: the last step tells how the payment ended. */
const dotStatus = (event: PaymentTransactionEvent) => {
  switch (event.status) {
    case 'SUCCESS':
      return 'done'
    case 'FAILED':
    case 'CANCELLED':
    case 'REFUNDED':
      return 'error'
    default:
      return 'current'
  }
}

export function PaymentDetail({ uid }: { uid: string }) {
  const { t } = useTranslation()

  const { transaction, history, subscription, userTransactions, stalled, cancelSubscription, refundSubscription } =
    usePaymentDetail(uid)

  const [cancelling, setCancelling] = useState(false)
  const [refunding, setRefunding] = useState(false)

  if (!transaction) {
    return (
      <Card className='shadow-none'>
        <CardContent className='flex flex-col items-start gap-3 py-10'>
          <p className='font-medium'>{t('manage.paymentDetail.notFound')}</p>
          <p className='text-muted-foreground text-sm break-all'>{t('manage.paymentDetail.notFoundHint', { uid })}</p>
          <Button render={<Link href='/manage/payments' />} nativeButton={false} variant='outline'>
            <ArrowLeftIcon className='size-4' />
            {t('manage.paymentDetail.backToPayments')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='flex flex-col gap-3 lg:gap-6'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-col gap-1'>
          <Button
            render={<Link href='/manage/payments' />}
            nativeButton={false}
            variant='ghost'
            size='sm'
            className='-ml-2 w-fit'
          >
            <ArrowLeftIcon className='size-4' />
            {t('manage.paymentDetail.allPayments')}
          </Button>
          <h1 className='truncate font-mono text-2xl font-semibold' title={transaction.uid}>
            {shortUid(transaction.uid)}
          </h1>
          <div className='flex flex-wrap items-center gap-2'>
            <TransactionStatusBadge status={transaction.status} />
            <ProviderBadge provider={transaction.provider} />
            <Badge variant='outline'>{t(`manage.purchaseTypes.${transaction.purchaseType}`)}</Badge>
          </div>
        </div>

        <Button render={<Link href={`/manage/users/${transaction.userUid}`} />} nativeButton={false} variant='outline'>
          {t('manage.paymentDetail.openPayer', { name: transaction.username })}
          <ArrowUpRightIcon className='size-4' />
        </Button>
      </div>

      {stalled ? (
        <Alert>
          <HourglassIcon />
          <AlertTitle>{t('manage.paymentDetail.stalledAlert.title')}</AlertTitle>
          <AlertDescription>{t('manage.paymentDetail.stalledAlert.description')}</AlertDescription>
        </Alert>
      ) : null}

      <div className='grid gap-3 lg:grid-cols-2 lg:gap-6'>
        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.paymentDetail.payment.title')}</CardTitle>
            <CardDescription>{t('manage.paymentDetail.payment.description')}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col divide-y'>
            <DetailRow label={t('manage.paymentDetail.fields.id')}>{transaction.id}</DetailRow>
            <DetailRow label={t('manage.paymentDetail.fields.uid')}>
              <code className='text-xs break-all'>{transaction.uid}</code>
            </DetailRow>
            <DetailRow label={t('manage.paymentDetail.fields.amount')}>
              {transaction.amount !== null && transaction.currency !== null ? (
                <AmountCell amount={transaction.amount} currency={transaction.currency} />
              ) : (
                <span className='text-muted-foreground' title={t('manage.payments.noAmountHint')}>
                  {t('manage.payments.noAmount')}
                </span>
              )}
            </DetailRow>
            <DetailRow label={t('manage.paymentDetail.fields.coins')}>{formatCoins(transaction.coins)}</DetailRow>
            <DetailRow label={t('manage.paymentDetail.fields.package')}>
              {transaction.packageId ? (
                <code className='text-xs'>{transaction.packageId}</code>
              ) : (

                // No package means `PaymentInitDto.customAmount`: the payer typed a sum and
                // `PriceService.calcAmountCoin` turned it into coins.
                <span className='text-muted-foreground' title={t('manage.paymentDetail.customAmountHint')}>
                  {t('manage.paymentDetail.customAmount')}
                </span>
              )}
            </DetailRow>
            <DetailRow label={t('manage.paymentDetail.fields.idempotencyKey')}>
              <code className='text-xs break-all'>{transaction.idempotencyKey}</code>
            </DetailRow>
            <DetailRow label={t('manage.paymentDetail.fields.created')}>
              <Timestamp value={transaction.createdAt} withTime />
            </DetailRow>
            <DetailRow label={t('manage.paymentDetail.fields.updated')}>
              <Timestamp value={transaction.updatedAt} withTime />
            </DetailRow>
            <DetailRow label={t('manage.paymentDetail.fields.completed')}>
              <Timestamp value={transaction.completedAt} withTime />
            </DetailRow>
          </CardContent>
        </Card>

        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.paymentDetail.provider.title')}</CardTitle>
            <CardDescription>{t('manage.paymentDetail.provider.description')}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col divide-y'>
            <DetailRow label={t('manage.columns.provider')}>
              <ProviderBadge provider={transaction.provider} />
            </DetailRow>

            {transaction.card ? (
              <DetailRow label={t('manage.columns.card')}>
                <CardMark card={transaction.card} />
              </DetailRow>
            ) : null}

            {/* Field names as the details entity spells them — they differ per provider,
                and an admin matching a row against the API needs the API's own words. */}
            {transaction.providerRefs.map(ref => (
              <DetailRow key={ref.field} label={ref.field}>
                <code className='text-xs break-all'>{ref.value}</code>
              </DetailRow>
            ))}

            <DetailRow label={t('manage.paymentDetail.fields.paymentLink')}>
              {transaction.paymentLink ? (
                <code className='text-xs break-all' title={transaction.paymentLink}>
                  {transaction.paymentLink}
                </code>
              ) : (
                <span className='text-muted-foreground'>{t('manage.badges.none')}</span>
              )}
            </DetailRow>
          </CardContent>
        </Card>

        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.paymentDetail.payer.title')}</CardTitle>
            <CardDescription>{t('manage.paymentDetail.payer.description')}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col divide-y'>
            <DetailRow label={t('manage.columns.user')}>
              <Link href={`/manage/users/${transaction.userUid}`} className='hover:underline'>
                {transaction.username}
              </Link>
            </DetailRow>
            <DetailRow label={t('manage.paymentDetail.fields.email')}>{transaction.email}</DetailRow>
            <DetailRow label={t('manage.paymentDetail.fields.userUid')}>
              <code className='text-xs break-all'>{transaction.userUid}</code>
            </DetailRow>
            <DetailRow label={t('manage.paymentDetail.fields.payerPayments')}>{userTransactions.length}</DetailRow>
          </CardContent>
        </Card>

        {subscription ? (
          <Card className='shadow-none'>
            <CardHeader>
              <CardTitle className='text-base'>{t('manage.paymentDetail.subscription.title')}</CardTitle>
              <CardDescription>{t('manage.paymentDetail.subscription.description')}</CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
              <div className='flex flex-col divide-y'>
                <DetailRow label={t('manage.columns.status')}>
                  <SubscriptionStatusBadge status={subscription.status} />
                </DetailRow>
                <DetailRow label={t('manage.paymentDetail.fields.plan')}>
                  <Badge variant='secondary'>{subscription.plan}</Badge>
                </DetailRow>
                <DetailRow label={t('manage.paymentDetail.fields.package')}>
                  <code className='text-xs'>{subscription.packageId}</code>
                </DetailRow>
                <DetailRow label={t('manage.paymentDetail.fields.autoRenew')}>
                  {t(subscription.autoRenew ? 'manage.paymentDetail.on' : 'manage.paymentDetail.off')}
                </DetailRow>
                <DetailRow label={t('manage.paymentDetail.fields.period')}>
                  <Timestamp value={subscription.currentPeriodStart} /> –{' '}
                  <Timestamp value={subscription.currentPeriodEnd} />
                </DetailRow>
                <DetailRow label={t('manage.paymentDetail.fields.nextCharge')}>
                  <Timestamp value={subscription.nextChargeAt} withTime />
                </DetailRow>
                <DetailRow label={t('manage.paymentDetail.fields.renewalAttempts')}>
                  {subscription.renewalAttempts}
                </DetailRow>
                <DetailRow label={t('manage.paymentDetail.fields.externalId')}>
                  {subscription.externalId ? (
                    <code className='text-xs break-all'>{subscription.externalId}</code>
                  ) : (
                    <span className='text-muted-foreground'>{t('manage.badges.none')}</span>
                  )}
                </DetailRow>
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                <Button
                  variant='outline'
                  disabled={!canCancelSubscription(subscription)}
                  onClick={() => setCancelling(true)}
                >
                  <BanIcon className='size-4' />
                  {t('manage.paymentDetail.subscription.cancel')}
                </Button>
                <Button
                  variant='destructive'
                  disabled={!canRefundSubscription(subscription)}
                  onClick={() => setRefunding(true)}
                >
                  <RotateCcwIcon className='size-4' />
                  {t('manage.paymentDetail.subscription.refund')}
                </Button>
              </div>

              {/* Both buttons can be dead ends the service itself enforces, so the page
                  says which rule applies instead of leaving them greyed out in silence. */}
              {subscription.provider === 'APPLE' ? (
                <p className='text-muted-foreground text-xs'>{t('manage.paymentDetail.subscription.appleHint')}</p>
              ) : canRefundSubscription(subscription) ? null : (
                <p className='text-muted-foreground text-xs'>{t('manage.paymentDetail.subscription.refundHint')}</p>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card className='shadow-none lg:col-span-2'>
          <CardHeader>
            <CardTitle className='text-base'>{t('manage.paymentDetail.history.title')}</CardTitle>
            <CardDescription>{t('manage.paymentDetail.history.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Timeline>
              {history.map((event, index) => (
                <TimelineItem key={event.id} status={index === history.length - 1 ? 'done' : 'default'}>
                  <TimelineHeading className='flex items-center gap-2'>
                    <span>{t(`manage.historyEvents.${event.event}`)}</span>
                    <TransactionStatusBadge status={event.status} />
                  </TimelineHeading>
                  <TimelineDot status={dotStatus(event)} />
                  {index < history.length - 1 ? <TimelineLine done /> : null}
                  <TimelineContent className='flex flex-col gap-1 pb-6'>
                    <span className='text-muted-foreground text-xs'>
                      <Timestamp value={event.createdAt} withTime /> ·{' '}
                      {t('manage.paymentDetail.history.by', { actor: event.changedBy })}
                    </span>
                    {event.rawDetails ? (
                      <code
                        className='bg-muted text-muted-foreground max-w-full truncate rounded px-1.5 py-0.5 text-xs'
                        title={event.rawDetails}
                      >
                        {event.rawDetails}
                      </code>
                    ) : null}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        title={t('manage.paymentDetail.cancelDialog.title')}
        description={t('manage.paymentDetail.cancelDialog.description')}
        confirmLabel={t('manage.paymentDetail.subscription.cancel')}
        onConfirm={() => {
          if (cancelSubscription()) {
            toast.success(t('manage.paymentDetail.toast.cancelled'))
          }
        }}
      />

      <ConfirmDialog
        open={refunding}
        onOpenChange={setRefunding}
        title={t('manage.paymentDetail.refundDialog.title')}
        description={t('manage.paymentDetail.refundDialog.description')}
        confirmLabel={t('manage.paymentDetail.subscription.refund')}
        onConfirm={() => {
          if (refundSubscription()) {
            toast.success(t('manage.paymentDetail.toast.refunded'))
          }
        }}
      />
    </div>
  )
}
