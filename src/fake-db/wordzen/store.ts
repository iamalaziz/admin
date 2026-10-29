/**
 * In-memory stand-in for `/api/v1/manager/**` and `/api/v1/admin/**`.
 *
 * The method names and arguments deliberately mirror the endpoints so that swapping this
 * for a real HTTP client is a change of implementation, not of call sites:
 *
 *   listCourses()                 GET    /manager/courses
 *   getCourse(id)                 GET    /manager/courses/{courseId}
 *   createCourse(payload)         POST   /manager/courses
 *   updateCourse(id, payload)     PUT    /manager/courses/{courseId}
 *   deleteCourseCover(id)         DELETE /manager/courses/{courseId}/cover
 *   reorderCourse(id, order)      POST   /manager/courses/{courseId}/reorder
 *   deleteCourse(id)              DELETE /manager/courses/{courseId}
 *   listModules(courseId)         GET    /manager/courses/{courseId}/modules
 *   ... and the same shape for modules, cards and phrase cards.
 *
 * Deletes remove the row outright. That matches the API today: `entity/Course` has an
 * `isDeleted` column, but `ManagerCourseDao.delete` hard-deletes and the soft-delete
 * lines are commented out.
 *
 * State lives for the lifetime of the tab: edits survive client-side navigation and are
 * lost on a full reload, which is the point of a fixture.
 */
import type {
  Card,
  CardPayload,
  Course,
  CourseDescription,
  CoursePayload,
  Module,
  ModulePayload,
  PhraseCard,
  PhraseCardPayload
} from '@/types/wordzen/content-types'
import { categoryByCode } from '@/types/wordzen/content-types'
import type { AdminUser, RoleCode, UserStatusView } from '@/types/wordzen/user-types'

import {
  allocateId,
  generateAuthors,
  generateCards,
  generateCourses,
  generateModules,
  generatePhraseCards,
  generateUsers,
  MOCK_REF_DATE
} from './generate'

/** The signed-in admin, used as `blockedBy` the way the API uses the JWT principal. */
export const CURRENT_ADMIN = {
  uid: '77777777-7777-4777-8777-777777777777',
  username: 'admin'
} as const

const nowIso = () => new Date().toISOString()

const byDisplayOrder = <T extends { displayOrder: number; id: number }>(a: T, b: T) =>
  a.displayOrder - b.displayOrder || a.id - b.id

/** Renumbers `displayOrder` to 1..n after an insert, delete or move. */
const renumber = <T extends { displayOrder: number }>(items: T[]): T[] =>
  items.map((item, index) => ({ ...item, displayOrder: index + 1 }))

class WordzenMockStore {
  private authors = generateAuthors()

  private courses: Course[] = generateCourses(this.authors)

  private users: AdminUser[] = generateUsers(this.authors)

  /** Modules are built per course on first read, cards per moduleRow. See generate.ts. */
  private modulesByCourse = new Map<number, Module[]>()

  private cardsByModule = new Map<number, Card[]>()

  private phraseCardsByModule = new Map<number, PhraseCard[]>()

  private listeners = new Set<() => void>()

  private version = 0

  /* ---------------------------------------------------------------- *
   * Subscription — drives useSyncExternalStore in the hooks layer
   * ---------------------------------------------------------------- */

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  getVersion = () => this.version

  private commit() {
    this.version += 1
    this.listeners.forEach(listener => listener())
  }

  /* ---------------------------------------------------------------- *
   * Courses
   * ---------------------------------------------------------------- */

  listCourses = (): Course[] => [...this.courses].sort(byDisplayOrder)

  getCourse = (courseId: number): Course | null => this.courses.find(course => course.id === courseId) ?? null

  createCourse = (payload: CoursePayload): Course => {
    const id = allocateId()

    const course: Course = {
      id,
      createdAt: nowIso(),
      title: payload.title,
      category: categoryByCode(payload.category),
      isPublic: payload.isPublic,
      cover: payload.cover,
      displayOrder: this.courses.length + 1,
      accessCode: payload.accessCode,
      authorUid: CURRENT_ADMIN.uid,
      authorUsername: CURRENT_ADMIN.username,
      descriptions: payload.descriptions.map((description, index) => ({
        id: id * 10 + index + 1,
        value: description.value,
        locale: description.locale
      })),
      moduleCount: 0
    }

    this.courses = [...this.courses, course]
    this.modulesByCourse.set(id, [])
    this.commit()

    return course
  }

  updateCourse = (courseId: number, payload: CoursePayload): Course | null => {
    const existing = this.getCourse(courseId)

    if (!existing) {
      return null
    }

    const descriptions: CourseDescription[] = payload.descriptions.map(description => ({
      // Reuse the id of the description already holding that locale so edits read as updates.
      id: existing.descriptions.find(current => current.locale === description.locale)?.id ?? allocateId(),
      value: description.value,
      locale: description.locale
    }))

    const updated: Course = {
      ...existing,
      title: payload.title,
      category: categoryByCode(payload.category),
      isPublic: payload.isPublic,
      cover: payload.cover,
      accessCode: payload.accessCode,
      descriptions
    }

    this.courses = this.courses.map(course => (course.id === courseId ? updated : course))

    // The API keeps a module private while its course is private; mirror that here so the
    // module list cannot show a public module under an unpublished course.
    if (!updated.isPublic) {
      const modules = this.modulesByCourse.get(courseId)

      if (modules) {
        this.modulesByCourse.set(
          courseId,
          modules.map(moduleRow => ({ ...moduleRow, isPublic: false }))
        )
      }
    }

    this.commit()

    return updated
  }

  /** `DELETE /manager/courses/{courseId}/cover` */
  deleteCourseCover = (courseId: number): Course | null => {
    const existing = this.getCourse(courseId)

    if (!existing) {
      return null
    }

    const updated = { ...existing, cover: null }

    this.courses = this.courses.map(course => (course.id === courseId ? updated : course))
    this.commit()

    return updated
  }

  reorderCourse = (courseId: number, displayOrder: number): void => {
    const ordered = this.listCourses()
    const from = ordered.findIndex(course => course.id === courseId)

    if (from === -1) {
      return
    }

    const to = Math.max(0, Math.min(ordered.length - 1, displayOrder - 1))
    const [moved] = ordered.splice(from, 1)

    ordered.splice(to, 0, moved)
    this.courses = renumber(ordered)
    this.commit()
  }

  deleteCourse = (courseId: number): void => {
    const modules = this.modulesByCourse.get(courseId) ?? []

    modules.forEach(moduleRow => {
      this.cardsByModule.delete(moduleRow.id)
      this.phraseCardsByModule.delete(moduleRow.id)
    })

    this.modulesByCourse.delete(courseId)
    this.courses = renumber(this.courses.filter(course => course.id !== courseId).sort(byDisplayOrder))
    this.commit()
  }

  /* ---------------------------------------------------------------- *
   * Modules
   * ---------------------------------------------------------------- */

  listModules = (courseId: number): Module[] => {
    const cached = this.modulesByCourse.get(courseId)

    if (cached) {
      return [...cached].sort(byDisplayOrder)
    }

    const course = this.getCourse(courseId)

    if (!course) {
      return []
    }

    const modules = generateModules(course)

    this.modulesByCourse.set(courseId, modules)

    return [...modules].sort(byDisplayOrder)
  }

  getModule = (moduleId: number): Module | null => {
    for (const course of this.courses) {
      const found = this.listModules(course.id).find(moduleRow => moduleRow.id === moduleId)

      if (found) {
        return found
      }
    }

    return null
  }

  createModule = (payload: ModulePayload): Module | null => {
    const course = this.getCourse(payload.courseId)

    if (!course) {
      return null
    }

    const modules = this.listModules(payload.courseId)

    const moduleRow: Module = {
      id: allocateId(),
      createdAt: nowIso(),
      title: payload.title,
      isPublic: course.isPublic && payload.isPublic,
      displayOrder: modules.length + 1,
      courseId: payload.courseId,
      cardCount: 0,
      phraseCardCount: 0
    }

    this.modulesByCourse.set(payload.courseId, [...modules, moduleRow])
    this.cardsByModule.set(moduleRow.id, [])
    this.phraseCardsByModule.set(moduleRow.id, [])
    this.syncModuleCount(payload.courseId)
    this.commit()

    return moduleRow
  }

  updateModule = (moduleId: number, payload: ModulePayload): Module | null => {
    const existing = this.getModule(moduleId)

    if (!existing) {
      return null
    }

    const course = this.getCourse(existing.courseId)

    const updated: Module = {
      ...existing,
      title: payload.title,
      isPublic: (course?.isPublic ?? false) && payload.isPublic
    }

    this.replaceModule(updated)
    this.commit()

    return updated
  }

  reorderModule = (moduleId: number, displayOrder: number): void => {
    const existing = this.getModule(moduleId)

    if (!existing) {
      return
    }

    const ordered = this.listModules(existing.courseId)
    const from = ordered.findIndex(moduleRow => moduleRow.id === moduleId)
    const to = Math.max(0, Math.min(ordered.length - 1, displayOrder - 1))
    const [moved] = ordered.splice(from, 1)

    ordered.splice(to, 0, moved)
    this.modulesByCourse.set(existing.courseId, renumber(ordered))
    this.commit()
  }

  deleteModule = (moduleId: number): void => {
    const existing = this.getModule(moduleId)

    if (!existing) {
      return
    }

    const remaining = this.listModules(existing.courseId).filter(moduleRow => moduleRow.id !== moduleId)

    this.cardsByModule.delete(moduleId)
    this.phraseCardsByModule.delete(moduleId)
    this.modulesByCourse.set(existing.courseId, renumber(remaining))
    this.syncModuleCount(existing.courseId)
    this.commit()
  }

  private replaceModule(updated: Module) {
    const modules = this.modulesByCourse.get(updated.courseId) ?? []

    this.modulesByCourse.set(
      updated.courseId,
      modules.map(moduleRow => (moduleRow.id === updated.id ? updated : moduleRow))
    )
  }

  private syncModuleCount(courseId: number) {
    const count = (this.modulesByCourse.get(courseId) ?? []).length

    this.courses = this.courses.map(course => (course.id === courseId ? { ...course, moduleCount: count } : course))
  }

  /* ---------------------------------------------------------------- *
   * Cards
   * ---------------------------------------------------------------- */

  listCards = (moduleId: number): Card[] => {
    const cached = this.cardsByModule.get(moduleId)

    if (cached) {
      return [...cached].sort(byDisplayOrder)
    }

    const moduleRow = this.getModule(moduleId)

    if (!moduleRow) {
      return []
    }

    const cards = generateCards(moduleRow)

    this.cardsByModule.set(moduleId, cards)

    return [...cards].sort(byDisplayOrder)
  }

  getCard = (cardId: number): Card | null => {
    for (const cards of this.cardsByModule.values()) {
      const found = cards.find(card => card.id === cardId)

      if (found) {
        return found
      }
    }

    return null
  }

  createCard = (payload: CardPayload): Card | null => {
    const moduleRow = this.getModule(payload.moduleId)

    if (!moduleRow) {
      return null
    }

    const cards = this.listCards(payload.moduleId)
    const id = allocateId()

    const card: Card = {
      id,
      createdAt: nowIso(),
      term: payload.term,
      image: payload.image,
      displayOrder: cards.length + 1,
      moduleId: payload.moduleId,
      translations: payload.translations.map((translation, index) => ({
        id: id * 10 + index + 1,
        value: translation.value,
        locale: translation.locale
      })),
      samples: payload.samples.map((sample, index) => ({
        id: id * 10 + 100 + index,
        value: sample.value,
        translation: sample.translation,
        locale: sample.locale
      }))
    }

    this.cardsByModule.set(payload.moduleId, [...cards, card])
    this.syncCardCount(payload.moduleId)
    this.commit()

    return card
  }

  updateCard = (cardId: number, payload: CardPayload): Card | null => {
    const existing = this.getCard(cardId)

    if (!existing) {
      return null
    }

    const updated: Card = {
      ...existing,
      term: payload.term,
      image: payload.image,
      translations: payload.translations.map((translation, index) => ({
        id: existing.translations[index]?.id ?? allocateId(),
        value: translation.value,
        locale: translation.locale
      })),
      samples: payload.samples.map((sample, index) => ({
        id: existing.samples[index]?.id ?? allocateId(),
        value: sample.value,
        translation: sample.translation,
        locale: sample.locale
      }))
    }

    this.replaceCard(updated)
    this.commit()

    return updated
  }

  /** `DELETE /manager/cards/{cardId}/image` */
  deleteCardImage = (cardId: number): Card | null => {
    const existing = this.getCard(cardId)

    if (!existing) {
      return null
    }

    const updated = { ...existing, image: null }

    this.replaceCard(updated)
    this.commit()

    return updated
  }

  reorderCard = (cardId: number, displayOrder: number): void => {
    const existing = this.getCard(cardId)

    if (!existing) {
      return
    }

    const ordered = this.listCards(existing.moduleId)
    const from = ordered.findIndex(card => card.id === cardId)
    const to = Math.max(0, Math.min(ordered.length - 1, displayOrder - 1))
    const [moved] = ordered.splice(from, 1)

    ordered.splice(to, 0, moved)
    this.cardsByModule.set(existing.moduleId, renumber(ordered))
    this.commit()
  }

  deleteCard = (cardId: number): void => {
    const existing = this.getCard(cardId)

    if (!existing) {
      return
    }

    const remaining = this.listCards(existing.moduleId).filter(card => card.id !== cardId)

    this.cardsByModule.set(existing.moduleId, renumber(remaining))
    this.syncCardCount(existing.moduleId)
    this.commit()
  }

  private replaceCard(updated: Card) {
    const cards = this.cardsByModule.get(updated.moduleId) ?? []

    this.cardsByModule.set(
      updated.moduleId,
      cards.map(card => (card.id === updated.id ? updated : card))
    )
  }

  private syncCardCount(moduleId: number) {
    const moduleRow = this.getModule(moduleId)

    if (!moduleRow) {
      return
    }

    this.replaceModule({ ...moduleRow, cardCount: (this.cardsByModule.get(moduleId) ?? []).length })
  }

  /* ---------------------------------------------------------------- *
   * Phrase cards
   * ---------------------------------------------------------------- */

  listPhraseCards = (moduleId: number): PhraseCard[] => {
    const cached = this.phraseCardsByModule.get(moduleId)

    if (cached) {
      return [...cached].sort(byDisplayOrder)
    }

    const moduleRow = this.getModule(moduleId)

    if (!moduleRow) {
      return []
    }

    const phraseCards = generatePhraseCards(moduleRow)

    this.phraseCardsByModule.set(moduleId, phraseCards)

    return [...phraseCards].sort(byDisplayOrder)
  }

  getPhraseCard = (phraseCardId: number): PhraseCard | null => {
    for (const phraseCards of this.phraseCardsByModule.values()) {
      const found = phraseCards.find(phraseCard => phraseCard.id === phraseCardId)

      if (found) {
        return found
      }
    }

    return null
  }

  createPhraseCard = (payload: PhraseCardPayload): PhraseCard | null => {
    const moduleRow = this.getModule(payload.moduleId)

    if (!moduleRow) {
      return null
    }

    const phraseCards = this.listPhraseCards(payload.moduleId)
    const id = allocateId()

    const phraseCard: PhraseCard = {
      id,
      createdAt: nowIso(),
      text: payload.text,
      displayOrder: phraseCards.length + 1,
      moduleId: payload.moduleId,
      explanations: payload.explanations.map((explanation, index) => ({
        id: id * 10 + index + 1,
        text: explanation.text,
        locale: explanation.locale
      }))
    }

    this.phraseCardsByModule.set(payload.moduleId, [...phraseCards, phraseCard])
    this.syncPhraseCardCount(payload.moduleId)
    this.commit()

    return phraseCard
  }

  updatePhraseCard = (phraseCardId: number, payload: PhraseCardPayload): PhraseCard | null => {
    const existing = this.getPhraseCard(phraseCardId)

    if (!existing) {
      return null
    }

    const updated: PhraseCard = {
      ...existing,
      text: payload.text,
      explanations: payload.explanations.map((explanation, index) => ({
        id: existing.explanations[index]?.id ?? allocateId(),
        text: explanation.text,
        locale: explanation.locale
      }))
    }

    const phraseCards = this.phraseCardsByModule.get(existing.moduleId) ?? []

    this.phraseCardsByModule.set(
      existing.moduleId,
      phraseCards.map(phraseCard => (phraseCard.id === phraseCardId ? updated : phraseCard))
    )
    this.commit()

    return updated
  }

  deletePhraseCard = (phraseCardId: number): void => {
    const existing = this.getPhraseCard(phraseCardId)

    if (!existing) {
      return
    }

    const remaining = this.listPhraseCards(existing.moduleId).filter(phraseCard => phraseCard.id !== phraseCardId)

    this.phraseCardsByModule.set(existing.moduleId, renumber(remaining))
    this.syncPhraseCardCount(existing.moduleId)
    this.commit()
  }

  private syncPhraseCardCount(moduleId: number) {
    const moduleRow = this.getModule(moduleId)

    if (!moduleRow) {
      return
    }

    this.replaceModule({
      ...moduleRow,
      phraseCardCount: (this.phraseCardsByModule.get(moduleId) ?? []).length
    })
  }

  /* ---------------------------------------------------------------- *
   * Users — `/api/v1/admin/**`
   * ---------------------------------------------------------------- */

  listUsers = (): AdminUser[] => [...this.users].sort((a, b) => a.id - b.id)

  getUser = (uid: string): AdminUser | null => this.users.find(user => user.uid === uid) ?? null

  /** `GET /admin/users/{uid}/status` */
  getUserStatus = (uid: string): UserStatusView | null => {
    const user = this.getUser(uid)

    if (!user) {
      return null
    }

    return {
      uid: user.uid,
      status: user.status,
      blockedAt: user.blockedAt,
      blockedReason: user.blockedReason,
      blockedBy: user.blockedBy,
      authVersion: user.authVersion
    }
  }

  /**
   * `PUT /admin/users/{uid}/block`. The `authVersion` bump is what invalidates the user's
   * existing tokens, so it is modelled here rather than left to the UI.
   */
  blockUser = (uid: string, reason: string | null): UserStatusView | null => {
    const user = this.getUser(uid)

    if (!user) {
      return null
    }

    const updated: AdminUser = {
      ...user,
      status: 'BLOCKED',
      blockedAt: nowIso(),
      blockedReason: reason?.trim() ? reason.trim() : null,
      blockedBy: CURRENT_ADMIN.uid,
      authVersion: user.authVersion + 1,
      updatedAt: nowIso()
    }

    this.users = this.users.map(current => (current.uid === uid ? updated : current))
    this.commit()

    return this.getUserStatus(uid)
  }

  /** `PUT /admin/users/{uid}/unblock` */
  unblockUser = (uid: string): UserStatusView | null => {
    const user = this.getUser(uid)

    if (!user) {
      return null
    }

    const updated: AdminUser = {
      ...user,
      status: 'ACTIVE',
      blockedAt: null,
      blockedReason: null,
      blockedBy: null,
      authVersion: user.authVersion + 1,
      updatedAt: nowIso()
    }

    this.users = this.users.map(current => (current.uid === uid ? updated : current))
    this.commit()

    return this.getUserStatus(uid)
  }

  /** Author/admin grants. No endpoint backs this yet — see the note in user-types.ts. */
  setUserRoles = (uid: string, roles: RoleCode[]): AdminUser | null => {
    const user = this.getUser(uid)

    if (!user) {
      return null
    }

    const updated: AdminUser = {
      ...user,

      // ROLE_USER is implicit for every account and cannot be revoked.
      roles: [...new Set<RoleCode>(['ROLE_USER', ...roles])],
      updatedAt: nowIso()
    }

    this.users = this.users.map(current => (current.uid === uid ? updated : current))
    this.commit()

    return updated
  }

  /* ---------------------------------------------------------------- *
   * Aggregates for the overview cards
   * ---------------------------------------------------------------- */

  getContentStats = () => {
    const courses = this.courses

    return {
      courseCount: courses.length,
      publishedCourseCount: courses.filter(course => course.isPublic).length,
      moduleCount: courses.reduce((total, course) => total + course.moduleCount, 0),
      paidCourseCount: courses.filter(course => course.accessCode !== 'FREE').length
    }
  }

  getUserStats = () => {
    const users = this.users

    return {
      userCount: users.length,
      blockedCount: users.filter(user => user.status === 'BLOCKED').length,
      subscribedCount: users.filter(user => user.subscription !== null).length,
      staffCount: users.filter(user => user.roles.some(role => role !== 'ROLE_USER')).length
    }
  }
}

/**
 * One instance per JS runtime. Next renders these pages on the server and then hydrates
 * them, so both sides build their own copy — identical, because the fixtures are seeded.
 */
export const mockStore = new WordzenMockStore()

export { MOCK_REF_DATE }
