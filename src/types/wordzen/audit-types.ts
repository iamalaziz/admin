/**
 * The admin audit trail — who changed what, in the content and user tools.
 *
 * Nothing records this today. The manager and admin endpoints mutate rows without writing
 * a history, and the entities carry only the last writer (`Course.authorUid`,
 * `User.blockedBy`), so the panel cannot answer "who unpublished this course last Tuesday"
 * from anything the API currently serves. An audit table plus one read endpoint would:
 *
 *   listAuditEntries(filter)  GET /api/v1/admin/audit?target=&action=&actor=&cursor=
 *
 * `field` on a change is the API's own field name (`isPublic`, `accessCode`, `roles`), not
 * a label — it is shown verbatim, so an entry stays legible against the DTOs and does not
 * need a translation per column.
 */
import type { RoleCode } from './user-types'

/** What was done. These are the mutations the tools actually expose. */
export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'PUBLISH',
  'UNPUBLISH',
  'REORDER',
  'BLOCK',
  'UNBLOCK',
  'ROLES',
  'GRANT',
  'REVOKE'
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

/** What it was done to. */
export const AUDIT_TARGETS = ['COURSE', 'MODULE', 'CARD', 'PHRASE_CARD', 'CATEGORY', 'ACHIEVEMENT', 'USER'] as const

export type AuditTargetType = (typeof AUDIT_TARGETS)[number]

/** A delete leaves nothing behind, a create had nothing before — hence the nullables. */
export type AuditChange = {
  field: string
  from: string | null
  to: string | null
}

/** The staff member who made the change. */
export type AuditActor = {
  uid: string
  username: string
  initials: string
  avatar: string | null

  /** Their most privileged role at the time, which is what authorised the change. */
  role: RoleCode
}

export type AuditTarget = {
  type: AuditTargetType

  /** The id or code the endpoint takes — a course id, an achievement code, a uid. */
  id: string

  name: string

  /** Where the target can be opened, or null once it has been deleted. */
  href: string | null

  /** The course or module the target sits in, for a card or a module. */
  context: string | null
}

export type AuditEntry = {
  id: string
  at: string
  actor: AuditActor
  action: AuditAction
  target: AuditTarget

  /** A sentence for what the field list cannot say — "removed with 22 modules". */
  summary: string | null

  changes: AuditChange[]
}

export const AUDIT_FILTERS = ['all', 'content', 'users', 'achievements', 'deletions'] as const

export type AuditFilter = (typeof AUDIT_FILTERS)[number]

/** Which targets each drawer tab keeps. `deletions` filters on the action instead. */
export const AUDIT_FILTER_TARGETS: Partial<Record<AuditFilter, readonly AuditTargetType[]>> = {
  content: ['COURSE', 'MODULE', 'CARD', 'PHRASE_CARD', 'CATEGORY'],
  users: ['USER'],
  achievements: ['ACHIEVEMENT']
}

/** The one tab defined by what was done rather than to what. */
export const AUDIT_FILTER_ACTIONS: Partial<Record<AuditFilter, readonly AuditAction[]>> = {
  deletions: ['DELETE', 'REVOKE']
}

/**
 * Grants and revocations are achievement work even though they target a user, so they
 * answer to both tabs.
 */
export const matchesAuditFilter = (entry: AuditEntry, filter: AuditFilter): boolean => {
  if (filter === 'all') {
    return true
  }

  if (filter === 'achievements') {
    return entry.target.type === 'ACHIEVEMENT' || entry.action === 'GRANT' || entry.action === 'REVOKE'
  }

  const actions = AUDIT_FILTER_ACTIONS[filter]

  if (actions) {
    return actions.includes(entry.action)
  }

  return AUDIT_FILTER_TARGETS[filter]?.includes(entry.target.type) ?? true
}
