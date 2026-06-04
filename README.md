<div align="center">

<img src="https://ibl.ai/images/iblai-logo.png" alt="ibl.ai" width="300" />

# LMS

**Open-source skills intelligence platform — discover courses, track competencies, earn credentials, and accelerate workforce development.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![Tauri](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri)](https://tauri.app)

[Features](#features) • [Quick Start](#quick-start) • [Deployment](#deployment) • [Architecture](#architecture) • [Configuration](#configuration) • [Contributing](#contributing)

_Deployed at [lms.ibl.ai](https://lms.ibl.ai)_

</div>

---

## AGENTS.md

Agent-facing guidance for AI assistants (Claude Code, Cursor, etc.) lives in [`AGENTS.md`](AGENTS.md). It covers prettier formatting, the `--no-verify` ban on git pushes, and the e2e coverage maintenance protocol. `CLAUDE.md` is a symlink to `AGENTS.md`.

Skill files referenced from `AGENTS.md`:

- [`.claude/skills/prettier-format.md`](.claude/skills/prettier-format.md) — formatting protocol
- [`.claude/skills/safe-push.md`](.claude/skills/safe-push.md) — pre-push hook handling (build, lint, typecheck, unit tests, coverage, e2e)
- [`.claude/skills/e2e-coverage.md`](.claude/skills/e2e-coverage.md) — when and how to update `e2e/coverage.json` and `e2e/COVERAGE.md`

---

## What is LMS?

LMS is a production-ready learning and skills management platform that connects learners with courses, tracks competency growth, issues credentials, and delivers actionable analytics. It ships as a modern web application backed by a powerful multi-tenant API with integrated LMS and AI mentor capabilities.

Whether you're an enterprise building an internal upskilling program, a university offering online courses, or an EdTech startup creating a branded learning marketplace — LMS gives you the complete stack out of the box.

---

## Features

### Course Discovery & Enrollment

- **Faceted search** — filter courses by subject, difficulty, skills, credential type, and content type
- **Personalized recommendations** — AI-powered course suggestions based on learner profile and goals
- **Course detail pages** — rich metadata with syllabus, learning outcomes, instructor bios, and prerequisites
- **Flexible enrollment** — self-enrollment, invitation-only, and Stripe-powered paid courses
- **EdX LMS integration** — embedded course content, progress tracking, and grading via iframe

### Skills & Competency Tracking

- **Skill inventory** — track earned skills with proficiency levels (0–5 scale)
- **Skill points** — accumulate points from course and unit completions
- **Skill leaderboards** — compare mastery across learners and cohorts
- **Self-reported skills** — onboarding flow for learners to declare existing competencies
- **Skills-to-course mapping** — see which courses develop which skills

### Credentials & Badges

- **Digital credentials** — earn and display certificates, badges, and micro-credentials
- **Credential verification** — issuer metadata, expiration tracking, and sharing
- **Course-linked credentials** — automatic credential issuance on course completion

### Programs & Learning Pathways

- **Multi-course programs** — structured program enrollments with progress tracking
- **Curated pathways** — guided learning sequences toward specific career goals
- **Program management** — pricing, enrollment windows, and custom metadata
- **Pathway creation** — build and share custom pathways for teams or organizations

### Learner Profile & Analytics

- **Activity dashboard** — courses enrolled, courses completed, skills acquired, time spent
- **Time-spent charts** — daily/weekly learning activity visualization
- **Public profile** — shareable learner profile with education, experience, and credentials
- **Resume builder** — education history, work experience, and portfolio links

### Analytics (Admin)

- **Overview dashboard** — platform-wide usage stats and engagement metrics
- **User analytics** — per-learner activity and cohort trends
- **Topic analysis** — most popular subjects and content breakdowns
- **Transcript viewer** — searchable session and activity logs
- **Financial reporting** — revenue tracking and billing analytics
- **Custom reports** — generate and download data exports

### Enterprise & Platform

- **Multi-tenancy** — full tenant isolation with per-org configuration, branding, and user management
- **Role-based access control (RBAC)** — granular permissions with roles, policies, and group-based access
- **SSO authentication** — Single Sign-On with configurable identity providers
- **Stripe billing** — paid courses, subscription management, and checkout flows
- **Notifications** — in-app notification system with alert templates
- **White-labeling** — custom themes, logos, and advanced CSS per tenant
- **AI mentor sidebar** — embedded conversational AI assistant for learner support
- **Configurable onboarding** — skill self-assessment and profile setup flows

---

## Tech Stack

| Layer     | Technology                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Framework | Next.js 15, React 19, TypeScript 5.9                                                                             |
| Styling   | Tailwind CSS 4, Radix UI, shadcn/ui                                                                              |
| State     | Redux Toolkit, React-Redux                                                                                       |
| Forms     | React Hook Form, TanStack Form, Zod                                                                              |
| Charts    | Recharts                                                                                                         |
| Animation | Framer Motion                                                                                                    |
| PDF       | react-pdf, pdfjs-dist                                                                                            |
| Desktop   | Tauri 2 (Windows, macOS, Linux, iOS, Android shell)                                                              |
| Testing   | Vitest, Testing Library, Playwright                                                                              |
| SDK       | [@iblai/iblai-js](https://www.npmjs.com/package/@iblai/iblai-js) — unified data layer, components, and utilities |

---

## Quick Start

### Prerequisites

- **Node.js 25.3.0+** (we recommend using [nvm](https://github.com/nvm-sh/nvm))
- **pnpm 10+** — `npm install -g pnpm`

### 1. Clone the repository

```bash
git clone https://github.com/iblai/lms.git
cd lms
```

> The repo is named `lms`; the application inside is **LMS**.

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your ibl.ai platform URLs and feature flags — see [Configuration › Environment Variables](#environment-variables) for the full reference.

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Node.js 25+ note:** The `dev` script already includes `NODE_OPTIONS='--no-experimental-webstorage'` to prevent conflicts with the SDK's browser storage guards. If you customize the script, keep that flag.

### Tests

```bash
pnpm test            # vitest unit tests
pnpm test:coverage   # unit tests with coverage report
pnpm test:e2e        # playwright e2e suite (headless)
pnpm test:e2e:ui     # playwright UI mode
pnpm test:e2e:headed # playwright in a headed browser
```

Playwright auth fixtures live under `e2e/`. Coverage tracking (`e2e/coverage.json` + `e2e/COVERAGE.md`) is enforced by the pre-push hook — see [`.claude/skills/e2e-coverage.md`](.claude/skills/e2e-coverage.md).

---

## Deployment

### Docker

Build and run with Docker:

```bash
docker build -t lms .
docker run -p 3000:3000 --env-file .env.local lms
```

### Standalone

```bash
pnpm build
pnpm start
```

`pnpm start` runs `pnpm exec next start` — a standard Next.js production server. Deploy to any host with Node.js 25+ installed.

### Desktop & Mobile (Tauri)

LMS ships with a [Tauri 2](https://tauri.app) shell in [`src-tauri/`](src-tauri) so the same Next.js bundle can be packaged as a native desktop app for Windows, macOS, and Linux, or a mobile app for iOS and Android.

There are **no `pnpm tauri:*` scripts** — invoke the Tauri CLI directly from the `src-tauri/` directory:

```bash
# desktop dev (hot reload)
cd src-tauri && cargo tauri dev

# desktop production build
cd src-tauri && cargo tauri build

# iOS / Android
cd src-tauri && cargo tauri ios init
cd src-tauri && cargo tauri android init
```

Requirements: Rust toolchain (`rustup`), plus platform-specific dependencies (Xcode for iOS, Android SDK + NDK for Android). See the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/).

---

## Architecture

```
lms/
├── app/                          # Next.js App Router
│   ├── home/                     # Learner dashboard
│   ├── discover/                 # Course discovery & search
│   ├── recommended/              # Personalized recommendations
│   ├── courses/[course_id]/      # Course details & enrollment
│   ├── course-content/           # EdX LMS integration (iframe)
│   │   └── [course_id]/          # Course, progress, bookmarks, forums
│   ├── programs/[program_id]/    # Program enrollments
│   ├── profile/                  # Learner profile
│   │   ├── skills/               # Skills inventory
│   │   ├── credentials/          # Earned credentials
│   │   ├── courses/              # Enrollment history
│   │   ├── programs/             # Program enrollments
│   │   ├── pathways/             # Learning pathways
│   │   └── public/               # Shareable profile
│   ├── analytics/                # Admin analytics
│   │   ├── courses/              # Course-level analytics
│   │   ├── users/                # User-level analytics
│   │   ├── programs/             # Program analytics
│   │   ├── topics/               # Topic breakdowns
│   │   ├── transcripts/          # Activity transcripts
│   │   ├── financial/            # Revenue & billing
│   │   ├── monetization/         # Monetization metrics
│   │   └── reports/              # Custom analytics reports
│   ├── notifications/            # Notification center
│   │   └── [notificationId]/     # Notification detail
│   ├── reports/[tenantKey]/      # Per-tenant reports
│   ├── start/                    # Onboarding flow
│   ├── sso-login/                # SSO authentication
│   ├── sso-login-complete/       # SSO completion handler
│   ├── error/[code]/             # Error pages
│   └── version/                  # App version info
│
├── components/                   # React components
│   ├── ui/                       # 52 shadcn/ui primitives
│   ├── header/                   # Navigation & user profile
│   ├── profile/                  # Profile cards (education, experience, skills)
│   ├── edx-iframe/               # LMS content embedding
│   ├── onboarding/               # Setup wizard slides
│   ├── chat/                     # Chat / mentor UI
│   └── ...                       # Feature components (course cards, dialogs, skeletons)
│
├── hooks/                        # 58 custom React hooks
│   ├── courses/                  # Course data, enrollment, navigation
│   ├── profile/                  # Profile stats, time spent, pathways
│   ├── skills/                   # Skill tracking & reporting
│   ├── discover/                 # Search & filtering
│   ├── search/                   # Catalog search & personalization
│   └── ...
│
├── features/                     # Feature modules (state + logic)
│   ├── mentor/                   # AI mentor sidebar
│   ├── rbac/                     # Role-based access control
│   └── tenant/                   # Multi-tenant context
│
├── services/                     # API service definitions
├── types/                        # TypeScript interfaces
├── config/                       # Runtime configuration
├── providers/                    # React context providers
├── lib/                          # Utilities
├── styles/                       # Global CSS
├── src-tauri/                    # Tauri desktop / mobile shell
├── e2e/                          # Playwright e2e suite + coverage tracking
├── docs/                         # Project docs ([theme-customization.md](docs/theme-customization.md))
└── public/                       # Static assets
```

### Data Flow

```
User → React Components → Custom Hooks → Redux (RTK Query) → ibl.ai API
                                              ↓
                                        @iblai/iblai-js SDK
                                        ├── /data-layer  (API slices, reducers)
                                        ├── /web-utils   (auth, providers, tenant hooks)
                                        └── /web-containers (shared UI components)
```

The app uses **[@iblai/iblai-js](https://www.npmjs.com/package/@iblai/iblai-js)** as its unified SDK, which bundles the data layer, authentication utilities, and shared components under a single package.

---

## Configuration

### Environment Variables

All app config is `NEXT_PUBLIC_*` (exposed to the browser). Defaults below match `.env.example`.

| Variable                                              | Required | Default                          | Description                                                       |
| ----------------------------------------------------- | -------- | -------------------------------- | ----------------------------------------------------------------- |
| `NODE_ENV`                                            | No       | `development`                    | Node environment                                                  |
| `NEXT_PUBLIC_API_BASE_URL`                            | Yes      | `https://api.iblai.app`          | Base API URL — `/dm`, `/axd`, `/lms`, `/studio` are derived from this |
| `NEXT_PUBLIC_LMS_URL`                                 | Yes      | `https://learn.iblai.app`        | EdX LMS host                                                      |
| `NEXT_PUBLIC_DM_URL_TEST`                             | No       |                                  | Override DM URL for testing                                       |
| `NEXT_PUBLIC_AUTH_URL`                                | Yes      | `https://login.iblai.app`        | Authentication service URL                                        |
| `NEXT_PUBLIC_MFE_URL`                                 | Yes      | `https://apps.learn.iblai.app`   | Open edX micro-frontends host                                     |
| `NEXT_PUBLIC_SPA_ANALYTICS_URL`                       | No       | `https://analytics.iblai.app`    | Analytics SPA URL                                                 |
| `NEXT_PUBLIC_MENTOR_URL`                              | No       | `https://mentorai.iblai.app`     | AI mentor service URL                                             |
| `NEXT_PUBLIC_PLATFORM_BASE_DOMAIN`                    | No       |                                  | Tenant subdomain root                                             |
| `NEXT_PUBLIC_SUPPORT_EMAIL`                           | No       | `support@ibl.ai`                 | Support contact email                                             |
| `NEXT_PUBLIC_COPYRIGHT`                               | No       |                                  | Footer copyright string                                           |
| `NEXT_PUBLIC_HIDE_RECOMMENDED_TAB`                    | No       | `false`                          | Hide the recommendations page                                     |
| `NEXT_PUBLIC_COURSE_ELIGIBILITY_ENABLED`              | No       | `false`                          | Enable enrollment prerequisite checks                             |
| `NEXT_PUBLIC_ENABLE_COURSE_ELIGIBILITY_LICENSE_CHECK` | No       | `false`                          | Gate eligibility on license status                                |
| `NEXT_PUBLIC_ENABLE_START_ROLE`                       | No       | `false`                          | Enable onboarding skill self-assessment                           |
| `NEXT_PUBLIC_ENABLE_MENTOR`                           | No       | `true`                           | Enable embedded AI mentor sidebar                                 |
| `NEXT_PUBLIC_ENABLE_GRAVATAR_ON_PROFILE_PIC`          | No       | `true`                           | Use Gravatar for profile pictures                                 |
| `NEXT_PUBLIC_ENABLE_RBAC`                             | No       | `false`                          | Enable role-based access control                                  |
| `NEXT_PUBLIC_USE_FOOTER_MENUS`                        | No       | `false`                          | Enable custom footer navigation                                   |
| `NEXT_PUBLIC_ENABLE_COMBINED_RECOMMENDATION_REPORT`   | No       | `false`                          | Aggregate recommendation reports                                  |
| `NEXT_PUBLIC_DISCOVER_FACETS_FILTERS_TO_HIDE`         | No       |                                  | Comma-separated list of discover facets to hide                   |
| `NEXT_PUBLIC_FOOTER_MENUS`                            | No       |                                  | JSON array of footer menu items                                   |
| `NEXT_PUBLIC_DEFAULT_EMBEDDED_MENTOR_NAME`            | No       | `mentorAI`                       | Default mentor identifier                                         |
| `NEXT_PUBLIC_COMBINED_RECOMMENDATION_REPORTS`         | No       |                                  | Combined recommendation reports config                            |

### Theming

Brand colors, fonts, and theme override entrypoints are documented in [`docs/theme-customization.md`](docs/theme-customization.md). Tenant-specific theming lives in tenant metadata.

### Feature Flags

Feature flags are set via `NEXT_PUBLIC_*` environment variables and control which features are visible at runtime:

- **Onboarding flow** — `NEXT_PUBLIC_ENABLE_START_ROLE=true`
- **AI mentor** — `NEXT_PUBLIC_ENABLE_MENTOR=true`
- **RBAC** — `NEXT_PUBLIC_ENABLE_RBAC=true`
- **Course eligibility** — `NEXT_PUBLIC_COURSE_ELIGIBILITY_ENABLED=true`
- **Recommendations tab** — `NEXT_PUBLIC_HIDE_RECOMMENDED_TAB=false`
- **Skill leaderboard** — configured via tenant metadata (`isSkillsLeaderBoardEnabled`)

---

## Scripts

| Script                 | Description                              |
| ---------------------- | ---------------------------------------- |
| `pnpm dev`             | Start dev server (port 3000)             |
| `pnpm build`           | Production build                         |
| `pnpm start`           | Start production server (`next start`)   |
| `pnpm lint`            | ESLint with auto-fix + typecheck         |
| `pnpm typecheck`       | TypeScript type checking                 |
| `pnpm format`          | Format with Prettier                     |
| `pnpm test`            | Unit tests (Vitest)                      |
| `pnpm test:coverage`   | Unit tests with coverage report          |
| `pnpm test:e2e`        | Playwright e2e suite (headless)          |
| `pnpm test:e2e:ui`     | Playwright UI mode                       |
| `pnpm test:e2e:headed` | Playwright in a headed browser           |
| `pnpm release`         | Release via release-it                   |
| `pnpm prepare`         | Husky pre-commit / pre-push hook install |

> Tauri builds are not exposed as npm scripts — run `cargo tauri dev` / `cargo tauri build` from `src-tauri/` directly (see [Deployment › Desktop & Mobile](#desktop--mobile-tauri)).

---

## ibl.ai Platform

LMS is built on the [ibl.ai](https://ibl.ai) platform. To use this app, you need access to an ibl.ai backend instance which provides:

- **Skills & Course API** — course catalog, enrollment, progress tracking, and skill management
- **EdX LMS** — course content delivery, grading, and certificate issuance
- **Authentication** — SSO, OAuth, JWT-based auth with multi-tenant support
- **Data Platform** — analytics, billing, user management, and notification services
- **AI Mentor API** — conversational AI for learner support (optional)

Visit [ibl.ai](https://ibl.ai) to set up your backend or request a hosted instance.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started.

Before pushing, review [`AGENTS.md`](AGENTS.md) and the skill files under [`.claude/skills/`](.claude/skills/) — the pre-push hook runs build, lint, typecheck, unit tests, coverage, and e2e validation, and `--no-verify` is **not** an option.

---

## Built With

- [Next.js 15](https://nextjs.org) — React framework with App Router
- [React 19](https://react.dev) — UI library
- [TypeScript 5.9](https://www.typescriptlang.org) — type safety
- [Tailwind CSS 4](https://tailwindcss.com) — utility-first styling
- [shadcn/ui](https://ui.shadcn.com) — accessible component primitives
- [Tauri 2](https://tauri.app) — desktop & mobile shell
- [Redux Toolkit](https://redux-toolkit.js.org) — state management
- [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) — unit & e2e testing
- [@iblai/iblai-js](https://www.npmjs.com/package/@iblai/iblai-js) — ibl.ai SDK

---

<div align="center">

Made with care by the [ibl.ai](https://ibl.ai) team

</div>
