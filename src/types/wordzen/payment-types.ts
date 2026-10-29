/**
 * Mirrors payment-api (port 18085): `entity/PaymentTransaction` joined with its
 * per-provider `payment_transaction_details_*` row, `entity/PaymentTransactionHistory`
 * and `entity/BillingSubscription`.
 *
 * Five gaps stand between these types and the running service:
 *
 * - **No admin ledger.** `GET /api/v1/transactions` returns the *caller's* rows
 *   (`findByUserUid(UserContext.getRequireUser().uid())`) and `GET /api/v1/transactions/{uid}`
 *   scopes to the caller as well (`findByUserUidAndTransactionUid`). A panel-wide list
 *   filtered by provider and status needs a new paginated endpoint.
 * - **No history endpoint.** `payment_transactions_history` gets a row on every status
 *   change — `PaymentTransactionService.updateStatus` writes it — but nothing serves it.
 * - **The amount is not on the transaction.** `PaymentTransactionResponse` carries coins
 *   only; the money sits on the details row (`amount`, plus `paymeAmount`/`amountTiyin` in
 *   minor units), so an admin view needs that row joined. Apple and Google Play details
 *   carry no amount at all — the stores do not report a price on a verify — which is why
 *   `amount` below is nullable rather than zero.
 * - **Cancel and refund are not admin endpoints.** `POST /api/v1/internal/billing-subscriptions/{uid}/cancel`
 *   and `/refund` exist, but they are guarded by the client-key scheme for the services
 *   rather than by an admin JWT, and cancel takes the owner's uid from the request.
 * - **No user join.** `username` and `email` below come from the mock store; payment-api
 *   holds a `userUid` and nothing else, so an admin list has to join against account-api
 *   or the endpoint above has to return the pair.
 *
 * Two provider rules the fixture honours, both straight from the services: `initiatePayment`
 * throws 410 for CLICK and PAYME, so no new transaction arrives on either; and
 * `BillingSubscriptionService` refuses to touch Apple (409 — the App Store owns both the
 * cancellation and the refund) and supports refunds for GOOGLE_PLAY and MULTICARD only.
 */

/** `dto/ProviderCode`. GOOGLE predates the Google Play integration and is unused. */
export const PROVIDER_CODES = ['CLICK', 'PAYME', 'MULTICARD', 'TELEGRAM', 'GOOGLE_PLAY', 'APPLE', 'GOOGLE'] as const

export type ProviderCode = (typeof PROVIDER_CODES)[number]

/** The providers `initiatePayment` still accepts — CLICK and PAYME answer 410. */
export const LIVE_PROVIDER_CODES: readonly ProviderCode[] = ['MULTICARD', 'TELEGRAM', 'GOOGLE_PLAY', 'APPLE']

/** `dto/TransactionStatusCode` */
export const TRANSACTION_STATUS_CODES = ['CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED'] as const

export type TransactionStatusCode = (typeof TRANSACTION_STATUS_CODES)[number]

/** Neither settled nor dead: the states a payment can still move out of on its own. */
export const OPEN_TRANSACTION_STATUSES: readonly TransactionStatusCode[] = ['CREATED', 'PENDING']

/** `dto/CurrencyCode` */
export const CURRENCY_CODES = ['UZS', 'USD', 'TG_STARS'] as const

export type CurrencyCode = (typeof CURRENCY_CODES)[number]

/** `dto/PurchaseType` */
export const PURCHASE_TYPES = ['COIN_PACKAGE', 'SUBSCRIPTION_PACKAGE'] as const

export type PurchaseType = (typeof PURCHASE_TYPES)[number]

/** `dto/EventHistoryCode` */
export const EVENT_HISTORY_CODES = ['INIT', 'PREPARE', 'COMPLETE', 'CANCEL'] as const

export type EventHistoryCode = (typeof EVENT_HISTORY_CODES)[number]

/** `dto/ChangedHistoryCode` — SYSTEM for our own writes, otherwise the callback's sender. */
export const CHANGED_HISTORY_CODES = [
  'SYSTEM',
  'CLICK',
  'TELEGRAM',
  'PAYME',
  'MULTICARD',
  'GOOGLE_PLAY',
  'APPLE'
] as const

export type ChangedHistoryCode = (typeof CHANGED_HISTORY_CODES)[number]

/** `dto/BillingSubscriptionStatus` */
export const BILLING_SUBSCRIPTION_STATUSES = [
  'ACTIVE',
  'CANCELLED',
  'PAST_DUE',
  'PAUSED',
  'EXPIRED',
  'REVOKED'
] as const

export type BillingSubscriptionStatus = (typeof BILLING_SUBSCRIPTION_STATUSES)[number]

/**
 * The card networks a bound card can belong to, read off the masked `card_tokens.number`
 * the way the number's prefix says: 9860 is Humo, 4 is Visa, 5 is Mastercard.
 *
 * Uzcard — 8600, and the most common card in the country — is missing on purpose: there
 * is no logo for it in `public/images/brands`, and a row that falls back to bare text next
 * to three branded ones reads like a bug. Add the mark, then add the code here.
 */
export const CARD_BRANDS = ['HUMO', 'VISA', 'MASTERCARD'] as const

export type CardBrand = (typeof CARD_BRANDS)[number]

/** `entity/CardToken`, reduced to what a ledger row shows. */
export type PaymentCard = {
  uid: string
  brand: CardBrand

  /** Masked by the provider, as the entity stores it. */
  number: string
}

/** `dto/SubscriptionCode`, the plan a subscription package grants. */
export const PAYMENT_SUBSCRIPTION_CODES = ['BASIC', 'PRO'] as const

export type PaymentSubscriptionCode = (typeof PAYMENT_SUBSCRIPTION_CODES)[number]

/**
 * One identifier from the provider's details row, shown as the API names it.
 *
 * `field` is the entity's own field name — `clickTransId`, `invoiceId`, `purchaseToken` —
 * rather than a label, for the reason the audit trail shows field names verbatim: the row
 * stays legible against the DTOs and needs no translation per provider. The set differs
 * per provider, which is why this is a list instead of a fixed shape.
 */
export type ProviderRef = {
  field: string
  value: string
}

/**
 * A transaction as an admin ledger would serve it: `PaymentTransactionResponse` plus the
 * fields that live elsewhere — on the entity (`id`, `idempotencyKey`), on the details row
 * (`amount`, `currency`, `packageId`, `paymentLink`, the provider ids) and on the account
 * behind `userUid`.
 */
export type PaymentTransaction = {
  id: number
  uid: string
  userUid: string

  /** Joined from the user store; payment-api itself holds only the uid. */
  username: string
  email: string
  provider: ProviderCode
  status: TransactionStatusCode

  /** `internalCoinsAmount` — what the purchase credits. Zero for store subscriptions. */
  coins: number

  /** The details row's `amount`, in whole units of `currency`. Null for Apple and Google Play. */
  amount: number | null
  currency: CurrencyCode | null
  purchaseType: PurchaseType

  /** `AutoPurchase.packageId` for a coin package, the details row's for a store subscription. */
  packageId: string | null
  idempotencyKey: string
  createdAt: string
  updatedAt: string
  completedAt: string | null

  /** The provider's checkout URL, where one was handed back. */
  paymentLink: string | null

  /** The subscription this payment opened or renewed, if it was a recurring one. */
  subscriptionUid: string | null

  /**
   * The bound card the payment was taken from.
   *
   * Only Multicard carries one: `PaymentTransactionDetailsMulticard.cardUid` points at
   * `card_tokens`, and no other details row references a card. Click and Payme do create
   * card tokens, but nothing ties one to a transaction, so their rows say nothing here
   * rather than guessing.
   */
  card: PaymentCard | null
  providerRefs: ProviderRef[]
}

/** `entity/PaymentTransactionHistory` — one row per status change, oldest first. */
export type PaymentTransactionEvent = {
  id: number
  createdAt: string
  transactionUid: string
  userUid: string
  status: TransactionStatusCode
  event: EventHistoryCode
  changedBy: ChangedHistoryCode

  /** The JSON sent to or received from the provider. Shown as stored, never parsed. */
  rawDetails: string | null
}

/** `entity/BillingSubscription` — the provider-independent lifecycle row. */
export type BillingSubscription = {
  id: number
  uid: string
  userUid: string
  provider: ProviderCode
  packageId: string
  plan: PaymentSubscriptionCode
  status: BillingSubscriptionStatus
  autoRenew: boolean
  currentPeriodStart: string
  currentPeriodEnd: string
  nextChargeAt: string | null
  cancelledAt: string | null
  revokedAt: string | null
  cardUid: string | null
  externalId: string | null
  originTransactionUid: string
  lastTransactionUid: string
  lastProviderEventAt: string | null
  lastReconciledAt: string | null
  renewalAttempts: number
}

/**
 * Whether `cancel` would reach the provider.
 *
 * `BillingSubscriptionService.cancel` returns the row untouched once it is REVOKED or
 * EXPIRED, treats an already-cancelled row with auto-renew off as done, and answers 409
 * for Apple: an App Store subscription is cancelled by the subscriber in their own
 * settings, not by us.
 */
export const canCancelSubscription = (subscription: BillingSubscription): boolean => {
  if (subscription.provider === 'APPLE') {
    return false
  }

  if (subscription.status === 'REVOKED' || subscription.status === 'EXPIRED') {
    return false
  }

  return subscription.autoRenew || subscription.status !== 'CANCELLED'
}

/**
 * Whether `refund` would reach the provider.
 *
 * `BillingSubscriptionService.refund` calls Google Play's revoke or Multicard's refund,
 * answers 409 for Apple and 400 for every other provider.
 */
export const canRefundSubscription = (subscription: BillingSubscription): boolean =>
  subscription.status !== 'REVOKED' &&
  (subscription.provider === 'GOOGLE_PLAY' || subscription.provider === 'MULTICARD')

/**
 * Money, with the currency spelled out rather than localized.
 *
 * The locale is pinned for the reason `Timestamp` and the dashboard formatters pin theirs:
 * these cells render on the server and again on the client, and a locale-dependent
 * separator would differ between the two passes. UZS and Telegram stars have no minor unit
 * in practice; USD does, so the fraction digits follow the currency.
 */
const AMOUNT_FORMATS: Record<CurrencyCode, Intl.NumberFormat> = {
  UZS: new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  TG_STARS: new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })
}

export const formatAmount = (amount: number, currency: CurrencyCode): string =>
  `${formatAmountValue(amount, currency)} ${currency}`

/** The digits alone, for a cell that shows the currency as a mark instead of a code. */
export const formatAmountValue = (amount: number, currency: CurrencyCode): string =>
  AMOUNT_FORMATS[currency].format(amount)

const COIN_FORMAT = new Intl.NumberFormat('en-GB')

export const formatCoins = (coins: number): string => COIN_FORMAT.format(coins)

/** The first block of a uid, for a column that cannot hold all 36 characters. */
export const shortUid = (uid: string): string => uid.slice(0, 8)
