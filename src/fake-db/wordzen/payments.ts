/**
 * Faker-backed fixtures for the payments ledger.
 *
 * Seeded and clocked off `MOCK_REF_DATE` like the other fixtures, for the same two
 * reasons: the tables must not reshuffle on a reload, and the pages render on the server
 * and hydrate on the client, so both passes have to produce identical rows.
 *
 * The rows follow payment-api's own flows rather than inventing a shape:
 *
 * - A card or wallet payment buys **coins** (`initiatePayment`): the transaction carries
 *   `internalCoinsAmount` and the money sits on the provider's details row. A payment
 *   with a `packageId` resolves its coins through `PriceService.getAmountCoinByPackageId`;
 *   one without is a custom amount run through `calcAmountCoin`, which is why a share of
 *   the rows below have no package.
 * - An App Store or Play purchase buys a **subscription package**
 *   (`initiateExternalSubscriptionPayment`): `internalCoinsAmount` is 0, the package id is
 *   on the details row, and the store reports no price, so those rows have no amount.
 * - CLICK and PAYME are switched off — `initiatePayment` answers 410 for both — so neither
 *   appears in the recent part of the window, only in its history.
 * - Every status change writes a `payment_transactions_history` row, so the event list per
 *   transaction is built from the status it ended on rather than sprinkled at random.
 *
 * The subscription packages are `docker/postgres/seed-payment.sql` copied row for row, so
 * the package ids and prices match the local storefront. The coin packages are invented:
 * `payment_packages` has no local seed, so there is nothing to copy.
 */
import { faker } from '@faker-js/faker'

import type {
  BillingSubscription,
  BillingSubscriptionStatus,
  ChangedHistoryCode,
  CurrencyCode,
  EventHistoryCode,
  CardBrand,
  PaymentCard,
  PaymentSubscriptionCode,
  PaymentTransaction,
  PaymentTransactionEvent,
  ProviderCode,
  ProviderRef,
  TransactionStatusCode
} from '@/types/wordzen/payment-types'
import type { AdminUser } from '@/types/wordzen/user-types'

import { MOCK_REF_DATE } from './generate'

const PAYMENT_SEED = 770_077

/**
 * How far back the ledger goes, and how many payments fill it.
 *
 * Half a year at roughly a dozen payments a day: enough that the running totals on the
 * stat cards are the sums a live storefront would show, and enough rows behind every
 * filter for the table to be worth paging through.
 */
const WINDOW_DAYS = 180
const TRANSACTION_COUNT = 2300

/**
 * Accounts that ever paid for anything. A ledger spread evenly over all 220 users would
 * give each one a handful of rows; a paying subset gives a user page a payment history.
 */
const PAYER_COUNT = 150

const DAY_MS = 86_400_000

/** CLICK and PAYME were turned off this long before the reference date. */
const PROVIDERS_OFF_AFTER_DAYS = 45

/* -------------------------------------------------------------------------- *
 * Catalogue
 * -------------------------------------------------------------------------- */

/**
 * `shop_subscriptions`, from the seed. `priceCoin` is what the plan costs in coins —
 * subscriptions are bought with coins in-app — while `priceStars` and `priceUzs` are what
 * the stores and the Uzbek providers charge for the same package.
 */
const SUBSCRIPTION_PACKAGES: readonly {
  packageId: string
  months: number
  priceCoin: number
  priceStars: number
  priceUzs: number
  code: PaymentSubscriptionCode
}[] = [
  { packageId: 'basic1mo', months: 1, priceCoin: 4000, priceStars: 190, priceUzs: 39900, code: 'BASIC' },
  { packageId: 'basic3mo', months: 3, priceCoin: 10800, priceStars: 510, priceUzs: 107730, code: 'BASIC' },
  { packageId: 'basic6mo', months: 6, priceCoin: 19200, priceStars: 910, priceUzs: 191520, code: 'BASIC' },
  { packageId: 'basic12mo', months: 12, priceCoin: 33600, priceStars: 1600, priceUzs: 335160, code: 'BASIC' },
  { packageId: 'pro1mo', months: 1, priceCoin: 10000, priceStars: 470, priceUzs: 99900, code: 'PRO' },
  { packageId: 'pro3mo', months: 3, priceCoin: 27000, priceStars: 1270, priceUzs: 269730, code: 'PRO' },
  { packageId: 'pro6mo', months: 6, priceCoin: 48000, priceStars: 2260, priceUzs: 479520, code: 'PRO' },
  { packageId: 'pro12mo', months: 12, priceCoin: 84000, priceStars: 3950, priceUzs: 839160, code: 'PRO' }
]

/**
 * `payment_packages`. Invented, unlike the subscriptions above: the table is not seeded
 * locally. The prices follow the rate the seeded storefront implies — about 10 UZS and
 * 0.05 Telegram stars to the coin — so a coin top-up and a subscription are comparable.
 */
const COIN_PACKAGES: readonly {
  packageId: string
  coins: number
  priceStars: number
  priceUzs: number

  /** How often the package is bought, relative to the others. */
  weight: number
}[] = [
  { packageId: 'coins1000', coins: 1000, priceStars: 48, priceUzs: 9900, weight: 16 },
  { packageId: 'coins2500', coins: 2500, priceStars: 119, priceUzs: 24900, weight: 18 },
  { packageId: 'coins5000', coins: 5000, priceStars: 238, priceUzs: 49900, weight: 20 },
  { packageId: 'coins12000', coins: 12000, priceStars: 571, priceUzs: 119900, weight: 18 },
  { packageId: 'coins25000', coins: 25000, priceStars: 1190, priceUzs: 249900, weight: 16 },
  { packageId: 'coins60000', coins: 60000, priceStars: 2857, priceUzs: 599900, weight: 12 }
]

/** `PaymentRate.ratio` for the two currencies the fixture charges in. */
const COINS_PER_UNIT: Record<'UZS' | 'TG_STARS', number> = { UZS: 0.1, TG_STARS: 21 }

/* -------------------------------------------------------------------------- *
 * Weighted picks
 *
 * Written out rather than taken from faker so the shares are visible: the mix is the
 * point of the fixture, and a reader should be able to see what "mostly Multicard" means.
 * -------------------------------------------------------------------------- */

type Weighted<T> = readonly { value: T; weight: number }[]

const pick = <T>(options: Weighted<T>): T => {
  const total = options.reduce((sum, option) => sum + option.weight, 0)

  let threshold = faker.number.float({ min: 0, max: total })

  for (const option of options) {
    threshold -= option.weight

    if (threshold <= 0) {
      return option.value
    }
  }

  return options[options.length - 1].value
}

/** The coin packages, carrying their own weights into `pick`. */
const COIN_PACKAGE_PICKS: Weighted<(typeof COIN_PACKAGES)[number]> = COIN_PACKAGES.map(item => ({
  value: item,
  weight: item.weight
}))

/** GOOGLE is absent: the enum keeps it, the service never writes it. */
const LIVE_PROVIDERS: Weighted<ProviderCode> = [
  { value: 'MULTICARD', weight: 38 },
  { value: 'TELEGRAM', weight: 24 },
  { value: 'GOOGLE_PLAY', weight: 20 },
  { value: 'APPLE', weight: 18 }
]

/** Before the cut-off the Uzbek card providers were still taking payments. */
const RETIRED_PROVIDERS: Weighted<ProviderCode> = [
  { value: 'CLICK', weight: 26 },
  { value: 'PAYME', weight: 18 },
  { value: 'MULTICARD', weight: 22 },
  { value: 'TELEGRAM', weight: 16 },
  { value: 'GOOGLE_PLAY', weight: 10 },
  { value: 'APPLE', weight: 8 }
]

/**
 * A payment older than a couple of days has been resolved one way or another — except for
 * the few that never were. Those stuck PENDING rows are deliberate: they are what an admin
 * opens this screen to find.
 */
const SETTLED_STATUSES: Weighted<TransactionStatusCode> = [
  { value: 'SUCCESS', weight: 70 },
  { value: 'FAILED', weight: 12 },
  { value: 'CANCELLED', weight: 10 },
  { value: 'REFUNDED', weight: 5 },
  { value: 'PENDING', weight: 2 },
  { value: 'CREATED', weight: 1 }
]

/** The last two days, where a checkout can legitimately still be open. */
const FRESH_STATUSES: Weighted<TransactionStatusCode> = [
  { value: 'SUCCESS', weight: 45 },
  { value: 'CREATED', weight: 18 },
  { value: 'PENDING', weight: 17 },
  { value: 'FAILED', weight: 12 },
  { value: 'CANCELLED', weight: 8 }
]

const SUBSCRIPTION_STATUSES: Weighted<BillingSubscriptionStatus> = [
  { value: 'ACTIVE', weight: 54 },
  { value: 'CANCELLED', weight: 14 },
  { value: 'EXPIRED', weight: 12 },
  { value: 'PAST_DUE', weight: 8 },
  { value: 'REVOKED', weight: 7 },
  { value: 'PAUSED', weight: 5 }
]

/* -------------------------------------------------------------------------- *
 * Helpers
 * -------------------------------------------------------------------------- */

const iso = (date: Date) => date.toISOString()

/** `ChangedHistoryCode` for a provider callback. GOOGLE has no code of its own. */
const initiatorFor = (provider: ProviderCode): ChangedHistoryCode => (provider === 'GOOGLE' ? 'SYSTEM' : provider)

/** The currency a provider charges in. The stores bill in their own, unreported, currency. */
const currencyFor = (provider: ProviderCode): CurrencyCode | null => {
  switch (provider) {
    case 'TELEGRAM':
      return 'TG_STARS'
    case 'CLICK':
    case 'PAYME':
    case 'MULTICARD':
      return 'UZS'
    default:
      return null
  }
}

/** A store purchase is always a subscription package; everything else buys coins. */
const isStoreProvider = (provider: ProviderCode) => provider === 'APPLE' || provider === 'GOOGLE_PLAY'

const addMonths = (from: Date, months: number) => {
  const date = new Date(from)

  date.setUTCMonth(date.getUTCMonth() + months)

  return date
}

/* -------------------------------------------------------------------------- *
 * Provider details
 *
 * One `payment_transaction_details_*` row per provider, reduced to the identifiers an
 * admin would chase a payment by. Field names are the entity's own.
 * -------------------------------------------------------------------------- */

type Details = {
  amount: number | null
  currency: CurrencyCode | null
  packageId: string | null
  paymentLink: string | null
  card: PaymentCard | null
  refs: ProviderRef[]
}

const hex = (length: number) => faker.string.hexadecimal({ length, casing: 'lower', prefix: '' })

/**
 * The card issuing ranges behind each brand, so a masked number and its logo agree.
 *
 * Humo cards dominate locally, which is what the weights say; Uzcard is the one brand the
 * ledger leaves out, for the reason `CARD_BRANDS` gives.
 */
const CARD_BRAND_PICKS: Weighted<{ brand: CardBrand; prefix: string }> = [
  { value: { brand: 'HUMO', prefix: '9860' }, weight: 58 },
  { value: { brand: 'VISA', prefix: '4278' }, weight: 28 },
  { value: { brand: 'MASTERCARD', prefix: '5614' }, weight: 14 }
]

/** A `card_tokens` row, masked the way a provider hands the number back. */
const buildCard = (): PaymentCard => {
  const { brand, prefix } = pick(CARD_BRAND_PICKS)

  return {
    uid: faker.string.uuid(),
    brand,
    number: `${prefix} ${faker.string.numeric(2)}** **** ${faker.string.numeric(4)}`
  }
}

const buildDetails = (provider: ProviderCode, uid: string): Details => {
  const currency = currencyFor(provider)

  if (isStoreProvider(provider)) {
    const plan = faker.helpers.arrayElement(SUBSCRIPTION_PACKAGES)

    return {
      amount: null,
      currency: null,
      packageId: plan.packageId,
      paymentLink: null,
      card: null,
      refs:
        provider === 'APPLE'
          ? [
              { field: 'productId', value: `com.stnapps.wordzen.${plan.packageId}` },
              { field: 'transactionId', value: faker.string.numeric(16) },
              { field: 'originalTransactionId', value: faker.string.numeric(16) },
              { field: 'environment', value: 'Production' },
              { field: 'productType', value: 'Auto-Renewable Subscription' }
            ]
          : [
              { field: 'productId', value: plan.packageId },
              { field: 'basePlanId', value: `${plan.packageId}-base` },
              {
                field: 'orderId',
                value: `GPA.${faker.string.numeric(4)}-${faker.string.numeric(4)}-${faker.string.numeric(4)}-${faker.string.numeric(5)}`
              },
              { field: 'purchaseToken', value: `${hex(24)}.AO-J1Oy${hex(12)}` },
              { field: 'packageName', value: 'com.stnapps.wordzen' }
            ]
    }
  }

  // A custom amount — `PaymentInitDto.customAmount` with no package — is the other branch
  // of `initiatePayment`, so a fifth of the top-ups take it.
  const custom = faker.datatype.boolean({ probability: 0.2 })
  const stars = currency === 'TG_STARS'

  const coinPackage = pick(COIN_PACKAGE_PICKS)

  const amount = custom
    ? stars
      ? faker.number.int({ min: 50, max: 2000 })
      : faker.number.int({ min: 10, max: 400 }) * 1000
    : stars
      ? coinPackage.priceStars
      : coinPackage.priceUzs

  const base: Details = {
    amount,
    currency,
    packageId: custom ? null : coinPackage.packageId,
    paymentLink: null,
    card: null,
    refs: []
  }

  switch (provider) {
    case 'CLICK':
      return {
        ...base,
        paymentLink: `https://my.click.uz/services/pay?transaction_param=${uid}`,
        refs: [
          { field: 'clickTransId', value: faker.string.numeric(10) },
          { field: 'prepareId', value: faker.string.numeric(8) }
        ]
      }
    case 'PAYME':
      return {
        ...base,

        // Payme stores the amount in tiyin as well; the UI shows the UZS column only.
        refs: [
          { field: 'receiptId', value: hex(24) },
          { field: 'paymeAmount', value: String(amount * 100) }
        ]
      }
    case 'MULTICARD': {
      const card = buildCard()

      return {
        ...base,
        paymentLink: `https://dev.multicard.uz/payment/${hex(8)}`,
        card,
        refs: [
          { field: 'multicardUuid', value: faker.string.uuid() },
          { field: 'invoiceId', value: faker.string.numeric(9) },
          { field: 'paymentId', value: faker.string.numeric(7) },
          { field: 'cardUid', value: card.uid },
          { field: 'amountTiyin', value: String(amount * 100) }
        ]
      }
    }
    default:
      return {
        ...base,
        paymentLink: `https://t.me/invoice/${hex(10)}`,
        refs: [
          { field: 'telegramPaymentChargeId', value: `${faker.string.numeric(10)}_${hex(8)}` },
          { field: 'providerPaymentChargeId', value: faker.string.numeric(12) },
          { field: 'currency', value: 'XTR' }
        ]
      }
  }
}

/** Coins credited by a payment, the way `PriceService` would resolve them. */
const coinsFor = (details: Details, provider: ProviderCode): number => {
  if (isStoreProvider(provider) || details.amount === null || details.currency === null) {
    return 0
  }

  if (details.packageId !== null) {
    return COIN_PACKAGES.find(item => item.packageId === details.packageId)?.coins ?? 0
  }

  const ratio = details.currency === 'TG_STARS' ? COINS_PER_UNIT.TG_STARS : COINS_PER_UNIT.UZS

  return Math.round(details.amount * ratio)
}

/* -------------------------------------------------------------------------- *
 * Transactions
 * -------------------------------------------------------------------------- */

/**
 * The ledger, oldest first so ids run with the clock the way an identity column does.
 *
 * `subscriptionUid` is filled in afterwards by `generateBillingSubscriptions`: a
 * subscription is born from a transaction, so the transaction cannot name it yet.
 */
export const generateTransactions = (users: AdminUser[]): PaymentTransaction[] => {
  faker.seed(PAYMENT_SEED)

  // The documented demo accounts always pay, so their user pages have something on them.
  const payers = [...users.slice(0, 7), ...faker.helpers.arrayElements(users.slice(7), PAYER_COUNT - 7)]

  const drafts = Array.from({ length: TRANSACTION_COUNT }, () => {
    const createdAt = faker.date.between({
      from: new Date(MOCK_REF_DATE.getTime() - WINDOW_DAYS * DAY_MS),
      to: MOCK_REF_DATE
    })

    const ageDays = (MOCK_REF_DATE.getTime() - createdAt.getTime()) / DAY_MS

    const provider = pick(ageDays > PROVIDERS_OFF_AFTER_DAYS ? RETIRED_PROVIDERS : LIVE_PROVIDERS)

    return {
      createdAt,
      provider,
      status: pick(ageDays < 2 ? FRESH_STATUSES : SETTLED_STATUSES),
      user: faker.helpers.arrayElement(payers)
    }
  }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  return drafts.map((draft, index) => {
    const uid = faker.string.uuid()
    const details = buildDetails(draft.provider, uid)

    // A payment that never settled was last touched when it was abandoned; a settled one,
    // when the provider confirmed it. Either way `updatedAt` is the last history row.
    const settled = draft.status !== 'CREATED'

    const completedAt =
      draft.status === 'SUCCESS' || draft.status === 'REFUNDED'
        ? faker.date.soon({ days: 1, refDate: draft.createdAt })
        : null

    const updatedAt =
      completedAt ?? (settled ? faker.date.soon({ days: 1, refDate: draft.createdAt }) : draft.createdAt)

    return {
      id: index + 1,
      uid,
      userUid: draft.user.uid,
      username: draft.user.username,
      email: draft.user.email,
      provider: draft.provider,
      status: draft.status,
      coins: coinsFor(details, draft.provider),
      amount: details.amount,
      currency: details.currency,
      purchaseType: isStoreProvider(draft.provider) ? 'SUBSCRIPTION_PACKAGE' : 'COIN_PACKAGE',
      packageId: details.packageId,

      // The real key is the client's; this one only has to be unique and traceable.
      idempotencyKey: `${draft.provider.toLowerCase()}-${uid.slice(0, 13)}`,
      createdAt: iso(draft.createdAt),
      updatedAt: iso(updatedAt),
      completedAt: completedAt === null ? null : iso(completedAt),
      paymentLink: details.paymentLink,
      subscriptionUid: null,
      card: details.card,
      providerRefs: details.refs
    } satisfies PaymentTransaction
  })
}

/* -------------------------------------------------------------------------- *
 * History
 * -------------------------------------------------------------------------- */

/** The status path a transaction took to end where it did, in order. */
const EVENT_PATHS: Record<
  TransactionStatusCode,
  readonly { event: EventHistoryCode; status: TransactionStatusCode }[]
> = {
  CREATED: [{ event: 'INIT', status: 'CREATED' }],
  PENDING: [
    { event: 'INIT', status: 'CREATED' },
    { event: 'PREPARE', status: 'PENDING' }
  ],
  SUCCESS: [
    { event: 'INIT', status: 'CREATED' },
    { event: 'PREPARE', status: 'PENDING' },
    { event: 'COMPLETE', status: 'SUCCESS' }
  ],
  FAILED: [
    { event: 'INIT', status: 'CREATED' },
    { event: 'PREPARE', status: 'PENDING' },
    { event: 'CANCEL', status: 'FAILED' }
  ],
  CANCELLED: [
    { event: 'INIT', status: 'CREATED' },
    { event: 'PREPARE', status: 'PENDING' },
    { event: 'CANCEL', status: 'CANCELLED' }
  ],
  REFUNDED: [
    { event: 'INIT', status: 'CREATED' },
    { event: 'PREPARE', status: 'PENDING' },
    { event: 'COMPLETE', status: 'SUCCESS' },
    { event: 'CANCEL', status: 'REFUNDED' }
  ]
}

/** What `updateStatus` would have stored as `rawDetails` for one step. */
const rawDetailsFor = (
  transaction: PaymentTransaction,
  event: EventHistoryCode,
  status: TransactionStatusCode
): string | null => {
  if (event === 'INIT') {
    return null
  }

  const payload: Record<string, string | number> = { status }

  transaction.providerRefs.slice(0, 2).forEach(ref => {
    payload[ref.field] = ref.value
  })

  if (transaction.amount !== null) {
    payload.amount = transaction.amount
  }

  return JSON.stringify(payload)
}

/**
 * `payment_transactions_history` for one transaction.
 *
 * Built from the transaction rather than stored beside it, because it is derivable: the
 * path is fixed by the end status, the timestamps sit between `createdAt` and `updatedAt`,
 * and the initiator is SYSTEM for our own INIT and the provider for its callbacks. Seeded
 * per transaction id so the rows are the same however the page was reached.
 */
export const generateTransactionHistory = (transaction: PaymentTransaction): PaymentTransactionEvent[] => {
  faker.seed(PAYMENT_SEED + transaction.id)

  const path = EVENT_PATHS[transaction.status]
  const from = new Date(transaction.createdAt).getTime()
  const to = new Date(transaction.updatedAt).getTime()
  const span = Math.max(to - from, 1000)

  return path.map((step, index) => ({
    id: transaction.id * 100 + index,
    createdAt: iso(new Date(from + Math.round((span * index) / Math.max(path.length - 1, 1)))),
    transactionUid: transaction.uid,
    userUid: transaction.userUid,
    status: step.status,
    event: step.event,
    changedBy: step.event === 'INIT' ? 'SYSTEM' : initiatorFor(transaction.provider),
    rawDetails: rawDetailsFor(transaction, step.event, step.status)
  }))
}

/* -------------------------------------------------------------------------- *
 * Billing subscriptions
 * -------------------------------------------------------------------------- */

/** The package a subscription runs on, by what the transaction bought. */
const planFor = (transaction: PaymentTransaction) =>
  SUBSCRIPTION_PACKAGES.find(item => item.packageId === transaction.packageId) ??
  faker.helpers.arrayElement(SUBSCRIPTION_PACKAGES)

/**
 * `billing_subscriptions`, one per recurring payment, with the transaction's
 * `subscriptionUid` filled in as a side effect.
 *
 * Which payments recur follows the services: every successful store purchase opens a
 * subscription (`AppleService`/`GooglePlayService` verify and hand it to
 * `BillingSubscriptionService`), and a Multicard payment does when the payer bound the
 * card for auto-renewal — `PaymentTransactionDetailsMulticard.autoRenew` with a
 * `renewalSubscriptionUid`, which `MulticardRenewalTask` then charges again. Click, Payme
 * and Telegram have no renewal path at all.
 */
export const generateBillingSubscriptions = (transactions: PaymentTransaction[]): BillingSubscription[] => {
  faker.seed(PAYMENT_SEED + 1)

  const subscriptions: BillingSubscription[] = []

  transactions.forEach(transaction => {
    if (transaction.status !== 'SUCCESS' && transaction.status !== 'REFUNDED') {
      return
    }

    const recurring = isStoreProvider(transaction.provider)
      ? true
      : transaction.provider === 'MULTICARD' && faker.datatype.boolean({ probability: 0.3 })

    if (!recurring) {
      return
    }

    const plan = planFor(transaction)
    const start = new Date(transaction.completedAt ?? transaction.createdAt)
    const end = addMonths(start, plan.months)

    // A refunded payment is a revoked subscription: `refund` and `providerRefunded` both
    // set REVOKED and cut the period short at the moment of the refund.
    const status: BillingSubscriptionStatus =
      transaction.status === 'REFUNDED'
        ? 'REVOKED'
        : end.getTime() < MOCK_REF_DATE.getTime()
          ? pick([
              { value: 'EXPIRED', weight: 60 },
              { value: 'CANCELLED', weight: 25 },
              { value: 'REVOKED', weight: 15 }
            ])
          : pick(SUBSCRIPTION_STATUSES)

    const uid = faker.string.uuid()
    const autoRenew = status === 'ACTIVE' || status === 'PAST_DUE'
    const cancelledAt = status === 'CANCELLED' ? faker.date.between({ from: start, to: end }) : null
    const revokedAt = status === 'REVOKED' ? (transaction.completedAt ? new Date(transaction.updatedAt) : end) : null

    subscriptions.push({
      id: subscriptions.length + 1,
      uid,
      userUid: transaction.userUid,
      provider: transaction.provider,
      packageId: plan.packageId,
      plan: plan.code,
      status,
      autoRenew,
      currentPeriodStart: iso(start),
      currentPeriodEnd: iso(revokedAt ?? end),
      nextChargeAt: autoRenew ? iso(end) : null,
      cancelledAt: cancelledAt === null ? null : iso(cancelledAt),
      revokedAt: revokedAt === null ? null : iso(revokedAt),
      cardUid: transaction.card?.uid ?? null,

      // Apple's `originalTransactionId` and Play's `purchaseToken` are what the lifecycle
      // row keys on; Multicard renewals have no external handle of their own.
      externalId:
        transaction.providerRefs.find(ref => ref.field === 'originalTransactionId' || ref.field === 'purchaseToken')
          ?.value ?? null,
      originTransactionUid: transaction.uid,
      lastTransactionUid: transaction.uid,
      lastProviderEventAt: transaction.completedAt,
      lastReconciledAt: iso(faker.date.recent({ days: 2, refDate: MOCK_REF_DATE })),
      renewalAttempts: status === 'PAST_DUE' ? faker.number.int({ min: 1, max: 3 }) : 0
    })

    transaction.subscriptionUid = uid
  })

  return subscriptions
}
