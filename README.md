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

Under `/manage`, modelled on the learning-api entities. **All of it runs on fixtures — no HTTP
call leaves the browser yet.**

| Route                        | What it does                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `/manage/courses`            | Course list: search, filter by category/access/state, reorder, create, edit, delete    |
| `/manage/courses/[courseId]` | One course — its fields and descriptions per locale, plus its module list              |
| `/manage/modules/[moduleId]` | One module — its cards (term, image, translations, samples) and phrase cards           |
| `/manage/users`              | User list: search by username/email/uid, filter by status/role/plan, block and unblock |
| `/manage/users/[uid]`        | One user — account, status, subscription and role grants                               |

Types live in `src/types/wordzen/` and mirror the API field for field (`CourseRequest`,
`ModuleRequest`, `CardRequest`, `PhraseCardRequest`, `UserStatusView`, …). The fixtures are in
`src/fake-db/wordzen/`:

- `generate.ts` — faker-backed generators, seeded so the data is identical on every render and
  on both sides of hydration. 54 courses, 20–24 modules each, 30–36 cards per module, 220 users.
  Cards are generated per module on first read, because building all ~39k up front is wasteful.
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

Local admin user: `admin@local.test` / `Passw0rd!` (`author@local.test` for the manager role).

Two gaps to close before the user tools can be wired up:

- **No admin user list.** `/api/v1/admin/**` only exposes per-user status
  (`GET /users/{uid}/status`, `PUT /users/{uid}/block`, `PUT /users/{uid}/unblock`). The closest
  thing to a list is account-api's `GET /api/v1/users/search`, which is not a paginated admin
  listing. `/manage/users` needs a real endpoint.
- **No role endpoint.** Granting `ROLE_AUTHOR` or `ROLE_ADMIN` has no API behind it, so the
  toggles on the user page only change the fixture.

Also note that deletes are permanent: `entity/Course` carries an `isDeleted` column, but
`ManagerCourseDao.delete` hard-deletes and the soft-delete lines are commented out. The tools
mirror that — the confirm dialogs say so, and there is no restore.

## Attribution

The UI is derived from [AdminCN Free](https://github.com/shadcnstudio/shadcn-nextjs-admincn-admin-template-free)
by shadcn/studio, used under the MIT license. `LICENSE.md` is upstream's notice, retained as the
license requires; it does not govern WordZen's own code.
