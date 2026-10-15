# CareerHub — The Employment Gazette

A job portal built like a newsroom: candidates file profiles and applications,
recruiters publish listings and run hiring pipelines, and an admin press office
oversees the whole gazette. Editorial design language — warm paper background,
ink black, oxblood-red accent, Space Grotesk display type.

Built for the CodSoft internship (Project 3 of 5).

## Features

- **Job board** — keyword search, filters (location, job type, desk/category,
  experience band), sorting (newest / highest salary), pagination
- **Job detail + apply flow** — cover note, attaches the résumé from your profile
- **Résumé upload** — PDF only, 5 MB limit, stored via a storage adapter
  (local disk by default; S3-compatible driver documented but untested)
- **Candidate desk** — profile (headline, location, skills, experience,
  education), résumé drawer, application tracker with live pipeline stages
- **Recruiter newsroom** — publish / edit / close / reopen listings, pipeline
  board (Applied → Shortlisted → Interview → Hired, plus Rejected) with
  button-based stage moves, candidate dossier view with résumé download and
  private notes
- **Admin press office** — user/job/application counts, users by role,
  applications by stage, recent listings and applications
- **Auth** — email + password (bcrypt), JWT in an httpOnly cookie, roles
  `CANDIDATE` / `RECRUITER` / `ADMIN`

## Tech stack

Next.js 14 (App Router) · TypeScript · Prisma 6 · PostgreSQL 16 ·
Tailwind CSS 3 · bcryptjs · jsonwebtoken · AWS SDK v3 (S3 driver, optional)

### Architecture notes

- `prisma/schema.prisma` — `User → Profile`, `User → Job → Application ← User`
  (unique constraint on `(jobId, candidateId)` prevents double applications).
- `lib/auth.ts` — password hashing, JWT sign/verify, cookie session helpers.
  Sessions live in the `ch_token` httpOnly cookie (7-day expiry). Route
  protection is done twice: `middleware.ts` for UX redirects (it only reads the
  unverified role claim — API routes always verify the signature properly).
- `lib/storage.ts` — `StorageDriver` interface (`upload` / `download` /
  `delete` / `fileUrl`). `LocalDiskDriver` (default) writes to `./uploads/`
  and files are served through `GET /api/files/[key]` with an authorization
  check (owner, job-owning recruiter, or admin). `S3Driver` is implemented
  against the AWS SDK v3 S3 client but **untested** — see Feature Status.
- API routes under `app/api/*`; pages are React Server Components with small
  client components for forms and the pipeline board.

## Setup (Windows PowerShell)

```powershell
# 1. Start PostgreSQL (needs Docker Desktop)
docker compose up -d

# 2. Install dependencies
npm install

# 3. Configure environment
Copy-Item .env.example .env
# Edit .env: set a long random JWT_SECRET

# 4. Run migrations + seed demo data
npx prisma migrate deploy
npm run db:seed

# 5. Run the app
npm run dev
# open http://localhost:3000
```

`npm run db:seed` creates 25 jobs, 8 candidates, 2 recruiters, 1 admin and
~24 applications across every pipeline stage (idempotent — wipes demo data first).

## Demo credentials (password for all: `password123`)

| Role      | Email                     |
|-----------|---------------------------|
| Candidate | `candidate@careerhub.local` |
| Recruiter | `recruiter@careerhub.local` |
| Admin     | `admin@careerhub.local`     |

More seeded accounts: `recruiter2@careerhub.local`, `diya.p@careerhub.local`,
`rohan.v@careerhub.local`, … (all `password123`).

## Feature status (honest)

| Feature | Status |
|---|---|
| Job search / filters / sort / pagination | ✅ Working |
| Job detail + apply flow (cover note) | ✅ Working |
| Résumé upload (PDF ≤ 5 MB) + recruiter download | ✅ Working (local-disk storage) |
| Candidate profile + application tracker | ✅ Working |
| Recruiter: post / edit / close / reopen jobs | ✅ Working |
| Pipeline board (button-based stage moves, notes) | ✅ Working |
| Admin overview (counts, recent items) | ✅ Working |
| JWT cookie sessions, 3 roles | ✅ Working |
| Local-disk file storage (default) | ✅ Working, tested |
| **S3-compatible storage driver** | ⚠️ Implemented but **untested** — no live bucket was available. Set `STORAGE_DRIVER=s3` and fill `S3_*` vars to try it. |
| Production `next build` | ✅ Passes (see Verification) |
| `prisma validate` / `prisma generate` | ✅ Pass |
| Seed script | ✅ Written; DB-backed run pending (see below) |

## Verification (2026-10-14, Linux build machine)

- `npm install` — ✅ passed
- `npx prisma validate` — ✅ "The schema at prisma/schema.prisma is valid"
- `npx prisma generate` — ✅ Prisma Client v6.19.3 generated
- `npm run build` (`next build`) — ✅ passed, all 27 routes compiled
- Migration SQL — ✅ generated via `prisma migrate diff` at
  `prisma/migrations/0001_init/migration.sql`
- `prisma migrate deploy` + `npm run db:seed` + runtime smoke test — ⚠️ **not
  run here**: no PostgreSQL server or Docker was available on the build
  machine. The seed script is written and type-checked; run the steps above on
  your machine (Docker Desktop) to verify.

Note: `npm install prisma@latest` currently resolves to the Prisma 8 RC, whose
CLI is incompatible with this project's classic workflow — this project pins
`prisma@6` / `@prisma/client@6`.

## Project structure

```
app/                  # Pages (jobs board, job detail, auth, dashboards, admin)
app/api/              # REST routes (auth, jobs, applications, profile, resume, files, admin)
components/           # Header, JobForm, PipelineBoard, ProfileEditor, ApplyForm, …
lib/                  # db.ts (Prisma), auth.ts (JWT cookies), storage.ts (file adapter), format.ts
prisma/               # schema.prisma, migrations/0001_init, seed.ts
docker-compose.yml    # PostgreSQL 16
uploads/              # local-disk file storage (gitignored, created at runtime)
```
