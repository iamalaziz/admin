/**
 * Mirrors learning-api `entity/User` (table `auth_user`), its `auth_user_login_simple`
 * credentials row, `entity/UserSubscription` and `dto/response/UserStatusView`.
 *
 * Note that `/api/v1/admin/**` only exposes per-user status today (`GET /users/{uid}/status`,
 * `PUT /users/{uid}/block`, `PUT /users/{uid}/unblock`). There is no admin list endpoint —
 * the closest is account-api's `GET /api/v1/users/search` — so the list below is backed by
 * the mock store and needs an API addition before it can be wired up.
 */

export const ROLE_CODES = ['ROLE_USER', 'ROLE_AUTHOR', 'ROLE_ADMIN'] as const

export type RoleCode = (typeof ROLE_CODES)[number]

export const USER_STATUS_CODES = ['ACTIVE', 'BLOCKED'] as const

export type UserStatusCode = (typeof USER_STATUS_CODES)[number]

export const SUBSCRIPTION_CODES = ['BASIC', 'PRO'] as const

export type SubscriptionCode = (typeof SUBSCRIPTION_CODES)[number]

/** `entity/UserSubscription` */
export type UserSubscription = {
  code: SubscriptionCode
  endSubscriptionDate: string | null
  updatedAt: string
}

/** `entity/User` joined with its credentials row and subscription. */
export type AdminUser = {
  id: number
  uid: string
  username: string
  email: string
  roles: RoleCode[]
  status: UserStatusCode
  authVersion: number
  createdAt: string
  updatedAt: string
  lastReset: string | null
  blockedAt: string | null
  blockedReason: string | null
  blockedBy: string | null
  subscription: UserSubscription | null
}

/** `dto/response/UserStatusView` */
export type UserStatusView = {
  uid: string
  status: UserStatusCode
  blockedAt: string | null
  blockedReason: string | null
  blockedBy: string | null
  authVersion: number
}

/** `dto/request/admin/BlockUserRequest` */
export type BlockUserPayload = {
  reason: string | null
}

/**
 * The one role worth showing for an account. Roles accumulate — a staff account still
 * holds ROLE_USER — so a list shows the most privileged grant instead of the whole stack.
 */
export const primaryRole = (roles: RoleCode[]): RoleCode =>
  roles.includes('ROLE_ADMIN') ? 'ROLE_ADMIN' : roles.includes('ROLE_AUTHOR') ? 'ROLE_AUTHOR' : 'ROLE_USER'
