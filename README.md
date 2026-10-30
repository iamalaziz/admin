# WordZen Admin

Staff-facing admin panel for WordZen. Separate from `app/` (the learner web app): its own
Next.js project, its own deploy, no shared bundle.

|                 |                                                              |
| --------------- | ------------------------------------------------------------ |
| Stack           | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui |
| Package manager | npm (`package-lock.json`), same as `app/`                     |
| Dev server      | http://localhost:3000 (`/` redirects to `/dashboard/orders`) |

```sh
npm install
npm run dev
```

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run lint:fix`, `npm run format`,
`npm run check-types`.

## Tools

Under `/manage`, modelled on the learning-api, account-api and payment-api entities. **All of
it runs on fixtures — no HTTP call leaves the browser yet.**

| Route                        | What it does                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `/manage/courses`            | Course list: search, filter by category/access/state, reorder, create, edit, delete    |
| `/manage/courses/[courseId]` | One course — its fields and descriptions per locale, plus its module list              |
| `/manage/modules/[moduleId]` | One module — its cards (term, image, translations, samples) and phrase cards           |
| `/manage/import`             | Bulk import: modules and their cards from a CSV or JSON file into one course, after a checked preview |
| `/manage/categories`         | Category catalogue: rename a category, add one on a free code, delete an unused one    |
| `/manage/achievements`       | Achievement catalogue: search, filter by group/state, reorder, create, edit, delete    |
| `/manage/achievements/[code]` | One achievement — its fields, its condition and the learners holding it               |
| `/manage/users`              | User list: search by username/email/uid, filter by status/role/plan, block and unblock |
| `/manage/users/[uid]`        | One user — account, status, subscription, role grants, achievement grants, payments by month |
| `/manage/payments`           | Payments ledger: search by uid/payer/provider id, filter by provider/status/purchase    |
| `/manage/payments/[uid]`     | One payment — its fields, the provider's ids and card, its status history, its subscription |

Types live in `src/types/wordzen/` and mirror the API field for field (`CourseRequest`,
`ModuleRequest`, `CardRequest`, `PhraseCardRequest`, `UserStatusView`, …). The fixtures are in
`src/fake-db/wordzen/`:

- `generate.ts` — faker-backed generators, seeded so the data is identical on every render and
  on both sides of hydration. 54 courses, 20–24 modules each, 30–36 cards per module, 220 users.
  Cards are generated per module on first read, because building all ~39k up front is wasteful.
  The achievement catalogue is not faker-generated: it is `AchievementCatalog` copied row for
  row, so the codes match the ones account-api seeds and the services award by. Only the
  grants are generated, on a curve that decays along the catalogue.
- `payments.ts` — the payment-api fixtures: 2,300 transactions over 180 days, their status
  history and the subscriptions they opened. The flows are the service's own — a card or
  wallet payment buys coins, an App Store or Play purchase buys a subscription package and
  reports no price, Click and Payme stop appearing at the point they were switched off. The
  subscription packages are `docker/postgres/seed-payment.sql` copied row for row; the coin
  packages are invented, because `payment_packages` has no local seed.
- `store.ts` — the mutable store. Its methods are named after the endpoints they stand in for,
  so swapping in a real client should be an implementation change, not a rewrite of call sites.

Edits live for the lifetime of the tab and are lost on a full reload. That is deliberate: it is
a fixture, not a database.

## Status of the rest

The template pages kept alongside these tools are reference material: the orders dashboard, the
Users app, the auth and profile/settings pages, form layouts and the data table. Crib from them,
and delete each one once nothing needs it. The auth pages under `/pages/auth/*` are still static
forms that do not call `account-api`.

## What it will talk to

Admin work maps onto two existing backend surfaces (see the workspace README for running the
stack and the Swagger links):

| Area                                                                              | API                  | Endpoints                                    |
| --------------------------------------------------------------------------------- | -------------------- | -------------------------------------------- |
| Course content — courses, modules, cards, phrase cards, uploads, image generation | learning-api (18084) | `/api/v1/manager/**`, requires `ROLE_AUTHOR` |
| User moderation — status, block/unblock, cache eviction                           | learning-api (18084) | `/api/v1/admin/**`, requires `ROLE_ADMIN`    |
| Achievements — catalogue, per-user grants                                        | account-api (18083)  | `/api/v1/achievements`, `/api/v1/users/**`   |
| Payments — transactions, subscription lifecycle                                  | payment-api (18085)  | `/api/v1/transactions`, `/api/v1/internal/**` |

Local admin user: `admin@local.test` / `Passw0rd!` (`author@local.test` for the manager role).

Four gaps to close before the tools can be wired up:

- **No admin user list.** `/api/v1/admin/**` only exposes per-user status
  (`GET /users/{uid}/status`, `PUT /users/{uid}/block`, `PUT /users/{uid}/unblock`). The closest
  thing to a list is account-api's `GET /api/v1/users/search`, which is not a paginated admin
  listing. `/manage/users` needs a real endpoint.
- **No role endpoint.** Granting `ROLE_AUTHOR` or `ROLE_ADMIN` has no API behind it, so the
  toggles on the user page only change the fixture.
- **No category endpoint.** `course_category` is seeded SQL and `CourseCategoryRepository` is
  only ever read, so `/manage/categories` writes to the fixture alone. Its shape is also capped
  by the schema: `code` is the `CourseCategoryCode` enum, so there is one row per code and nine
  rows in total. With the seed loaded every code is taken, which leaves renaming as the only
  move until a category is freed. Genuinely new categories need the enum column replaced by a
  free-form unique string in learning-api first.
- **No achievement catalogue endpoint, and no revoke.** account-api serves the catalogue and
  the per-user reads (`GET /api/v1/achievements`, `GET /api/v1/users/{uid}/achievements/all`),
  but the rows are seeded from `service/AchievementCatalog` by `AchievementCatalogSeeder` on
  boot, so creating, editing, reordering, deactivating and deleting one only change the
  fixture. Deleting a `user_achievements` row has no endpoint at all. Granting does —
  `POST /api/v1/users/{uid}/achievements` — but it is guarded by the client-key scheme, for
  the services that award achievements rather than for an admin JWT. A code invented in the
  tool is also inert until `model/AchievementCode` lists it.

- **No admin payments endpoint.** `GET /api/v1/transactions` returns the *caller's* rows and
  `/transactions/{uid}` is scoped to the caller too, so `/manage/payments` needs a paginated
  admin listing before it can be wired up. The status history has no endpoint at all, the
  money lives on the per-provider details row rather than on the transaction, and nothing
  joins a `userUid` to an account. Cancel and refund do exist —
  `POST /api/v1/internal/billing-subscriptions/{uid}/cancel` and `/refund` — but they answer
  to the client-key scheme for the services, not to an admin JWT. The tool mirrors the
  provider rules those two enforce: Apple is refused outright (the App Store owns both), and
  a refund reaches Google Play and Multicard only.

Also note that deletes are permanent: `entity/Course` carries an `isDeleted` column, but
`ManagerCourseDao.delete` hard-deletes and the soft-delete lines are commented out. The tools
mirror that — the confirm dialogs say so, and there is no restore.

## Attribution

The UI is derived from [AdminCN Free](https://github.com/shadcnstudio/shadcn-nextjs-admincn-admin-template-free)
by shadcn/studio, used under the MIT license. `LICENSE.md` is upstream's notice, retained as the
license requires; it does not govern WordZen's own code.
