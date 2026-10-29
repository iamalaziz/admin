# WordZen Admin

Staff-facing admin panel for WordZen. Separate from `app/` (the learner web app): its own
Next.js project, its own deploy, no shared bundle.

|                 |                                                              |
| --------------- | ------------------------------------------------------------ |
| Stack           | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui |
| Package manager | pnpm (`pnpm-lock.yaml`) — note that `app/` uses npm only     |
| Dev server      | http://localhost:3000 (`/` redirects to `/dashboard/orders`) |

```sh
pnpm install
pnpm dev
```

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm lint:fix`, `pnpm format`,
`pnpm check-types`.

## Status

This is the rebranded template shell — **no backend wiring yet**. Every screen still renders
the mock data it shipped with (`src/fake-db/`, inline fixtures in `src/views/`), and the auth
pages under `/pages/auth/*` are static forms that do not call `account-api`.

The pages kept from the template are deliberate reference material: the orders dashboard, Mail,
Calendar and Users apps, the auth and profile/settings pages, form layouts and the data table.
Crib from them when building real screens, and delete each one once nothing needs it.

## What it will talk to

Admin work maps onto two existing backend surfaces (see the workspace README for running the
stack and the Swagger links):

| Area                                                                              | API                  | Endpoints                                    |
| --------------------------------------------------------------------------------- | -------------------- | -------------------------------------------- |
| Course content — courses, modules, cards, phrase cards, uploads, image generation | learning-api (18084) | `/api/v1/manager/**`, requires `ROLE_AUTHOR` |
| User moderation — status, block/unblock, cache eviction                           | learning-api (18084) | `/api/v1/admin/**`, requires `ROLE_ADMIN`    |

Local admin user: `admin@local.test` / `Passw0rd!` (`author@local.test` for the manager role).

## Attribution

The UI is derived from [AdminCN Free](https://github.com/shadcnstudio/shadcn-nextjs-admincn-admin-template-free)
by shadcn/studio, used under the MIT license. `LICENSE.md` is upstream's notice, retained as the
license requires; it does not govern WordZen's own code.
